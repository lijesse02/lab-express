from flask import Flask, request, jsonify
from pyzbar.pyzbar import decode
from PIL import Image
from helper import barcodeOutput, toTwelve
from logic import logic, logicDict
import io
from flask_cors import CORS
from init import initialize_data, redis_client
import os
import json
import pandas as pd


app = Flask(__name__)

CORS(app)

@app.route('/')
def hello():
    return jsonify(message="Hello World")



@app.route('/api/decode', methods=['POST'])
def decode_barcode():
    if 'image' not in request.files:
        return jsonify({"error": "No Image Provided"}), 400
    
    image_file = request.files['image']
    image = Image.open(image_file)

    decoded_barcode = decode(image)
    if not decoded_barcode:
        return jsonify({"error": "No barcode detected"}), 400
    
    barcode_data = []
    
    for barcode in decoded_barcode:
        final_size_string, final_items_ordered = barcodeOutput(barcode.data.decode("utf-8"))
        if len(final_size_string) < 8:
            final_size_string = toTwelve(final_size_string)
        final_boxes = logic(final_size_string)
        barcode_info = {
            "data": barcode.data.decode("utf-8"),
            "order": final_items_ordered,
            "type": barcode.type,
            "size_count": final_size_string,
            "boxes": final_boxes
        }
        barcode_data.append(barcode_info)

    return jsonify({"barcodes": barcode_data})

@app.route('/api/decode-word', methods=['POST'])
def decode_word():
    #receive data
    data = request.get_json()

    #check for input and for "x"
    if not data or 'input_string' not in data:
        return jsonify({'error': 'input_string is required'}), 400
    input_string = data['input_string']
    if input_string[0] == 'x':

        #change to 12 length string
        input_string = toTwelve(input_string)

        #use logic/lookup to find box
        final_box = logic(input_string)

        #send back response
        order_info = {
            "type": "Input = x14",
            "size_count": input_string,
            "boxes": final_box
        }
    #Else do what decode barcode does
    else:
        final_size_string, final_items_ordered = barcodeOutput(input_string)
        if len(final_size_string) < 8:
            final_size_string = toTwelve(final_size_string)
        final_boxes = logic(final_size_string)
        order_info ={
            "data": input_string,
            "order": final_items_ordered,
            "type": "Entered Barcode",
            "size_count": final_size_string,
            "boxes": final_boxes
        }
    

    return jsonify({"barcodes": [order_info]})

@app.route('/api/decode-excel', methods=['POST'])
def decode_excel():
    #receive data
    if 'file' not in request.files:
        return jsonify({"error": "No Excel File Provided"}), 400
    
    excel_file = request.files['file']

    try:
        redis_client.delete("barcode_to_items")
        df = pd.read_excel(excel_file)
        current_order_number = ""
        items_in_order = []
        for row in df.itertuples(index=True):
            #check if the row is an order item
            if pd.isna(row.Num):
                #check if the order has been stored yet
                if items_in_order:
                    #store order and reset
                    redis_client.hset("barcode_to_items", current_order_number, json.dumps(items_in_order))
                    current_order_number = ""
                    items_in_order = []
            else:
                #check if row is a new order
                if current_order_number == "":
                    current_order_number = row.Num[1:-1]
                    items_in_order = [[row.Item, row.Qty]]
                #check if order number is a different order number
                elif current_order_number != row.Num[1:-1]:
                    #store if different order number
                    redis_client.hset("barcode_to_items", current_order_number, json.dumps(items_in_order))
                    current_order_number = row.Num[1:-1]
                    items_in_order = [[row.Item, row.Qty]]
                #check if item is shipping and handling
                elif "shipping and handling" in row.Item:
                    continue
                #another item in the order
                else:
                    #add item to order
                    items_in_order.append([row.Item, row.Qty])
        return jsonify({"status": "success! data imported"}), 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return jsonify({
            "status": "failed",
            "error_type": error_type,
            "error_message": error_message
        }), 500
    return jsonify({"status": "success! data imported"})

@app.route('/api/get-order-info', methods=['POST'])
def getOrderInfo():
    #grab data from request
    data = request.get_json()
    items = redis_client.hget('barcode_to_items', data["barcode"])
    if items:
        items = json.loads(items)
        itemList = []
        for item in items:
            itemList.append({"name": item[0], "quantity": item[1]})
        return jsonify({"status": "success", "items": itemList})
    return jsonify({'status': "failure. No items in order"})


@app.route('/api/get-item-info', methods=['POST'])
def getItemInfo():
    # grab data
    data = request.get_json()
    itemData = redis_client.hget('item_barcode_info', data["barcode"])
    if itemData:
        #Grab info from database for item
        itemData = json.loads(itemData)
        itemName = itemData["itemName"]
        itemSize = itemData["itemSize"]
        itemUM = itemData["itemUM"]
        itemQuantity = int(itemData["itemQuantity"])

        #Make list of item sizes with given data['items']
        sizeList = {
            "nv": 0,
            "pnv": 0,
            "wv": 0,
            "pwv": 0,
            "bt": 0,
            "pbt": 0,
            "bulk": 0
        }
        for item in data["items"]:
            sizeList[item.get("item_size")] += int(item.get("item_quantity"))
        sizeList[itemData["itemSize"]] += int(itemData["itemQuantity"])

        #return the box(es) to use as a string
        boxes = logicDict(sizeList)

        return jsonify({
                        "status": "success!",
                        "itemName": itemName,
                        "itemSize": itemSize,
                        "itemUM": itemUM,
                        "itemQuantity": itemQuantity,
                        "sizeList": sizeList,
                        "boxes": boxes
                        })
    else:
        return jsonify({"status": "No item",
                        })

@app.route('/api/new-item-barcode', methods=['POST'])
def newItemBarcode():
    data = request.get_json()
    item_name = data["itemName"]
    item_size = data["itemSize"]
    item_um = data["itemUM"]
    item_quantity = data['itemQuantity']
    value_object = {"itemName": item_name, "itemSize": item_size, "itemUM": item_um, "itemQuantity": item_quantity}
    redis_client.hset('item_barcode_info', data["barcode"], json.dumps(value_object))
    return jsonify({
        "status": "success!",
    })

@app.route('/api/add-configuration', methods=['POST'])
def addConfig():
    #receive data
    data = request.get_json()
    size_count = data["size_count"]
    boxes = data["boxes"]

    #parse and modify key if needed to 12 length
    size_count = toTwelve(size_count)

    #input into database
    redis_client.hset("uniq_to_uniq", size_count, json.dumps(boxes))
    return jsonify({"status": "Success!"})


if __name__ == "__main__":
    initialize_data(overwrite=False)
    app.run(host='0.0.0.0', port=5000)
    