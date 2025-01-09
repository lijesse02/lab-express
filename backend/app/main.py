from flask import Flask, request, jsonify
from pyzbar.pyzbar import decode
from PIL import Image
from helper import barcodeOutput, directOutput, toTwelve
from logic import logic
import io
from flask_cors import CORS
from init import initialize_data, redis_client
import os
import json


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
        final_boxes = directOutput(final_size_string)
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
            "type": "Input = x12",
            "size_count": input_string,
            "boxes": final_box
        }
    #Else do what decode barcode does
    else:
        final_size_string, final_items_ordered = barcodeOutput(input_string)
        if len(final_size_string) < 8:
            final_size_string = toTwelve(final_size_string)
        final_boxes = directOutput(final_size_string)
        order_info ={
            "data": input_string,
            "order": final_items_ordered,
            "type": "Entered Barcode",
            "size_count": final_size_string,
            "boxes": final_boxes
        }
    

    return jsonify({"barcodes": [order_info]})


@app.route('/api/get-item-info', methods=['POST'])
def getItemInfo():
    # grab data
    data = request.get_json()
    itemData = redis_client.hget('item_barcode_info', data["barcode"])
    if itemData:
        #Grab info from database
        itemData = json.loads(itemData)
        itemName = itemData["itemName"]
        itemSize = itemData["itemSize"]

        #Make list of item sizes
        sizeList = {
            "nv": 0,
            "nvp": 0,
            "wv": 0,
            "wvp": 0,
            "bt": 0,
            "btp": 0,
        }
        for item in data["items"]:
            sizeList[item.get("item_size")] += item.get("quantity")
        sizeList[itemData["itemSize"]] += 1

        return jsonify({
                        "status": "success!",
                        "itemName": itemName,
                        "itemSize": itemSize,
                        "sizeList": sizeList
                        })
    else:
        return jsonify({"status": "No item",
                        })

@app.route('/api/new-item-barcode', methods=['POST'])
def newItemBarcode():
    data = request.get_json()
    item_name = data["itemName"]
    item_size = data["itemSize"]
    value_object = {"itemName": item_name, "itemSize": item_size}
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
    