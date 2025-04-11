from flask import Flask, request, jsonify
from pyzbar.pyzbar import decode
from PIL import Image
from helper import barcodeOutput, toTwelve, order_to_string
from logic import logic, logicDict
import io
from flask_cors import CORS
from init import initialize_data, redis_client
import os
import json
import pandas as pd
import time
from datetime import datetime


app = Flask(__name__)
app.config["DEBUG"] = True
app.config["PROPAGATE_EXCEPTIONS"] = True

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
    #Takes order sheet from quickbooks
    #receive data
    if 'file' not in request.files:
        return jsonify({"error": "No Excel File Provided"}), 400
    
    excel_file = request.files['file']

    try:
        #Make the list of all new combinations and unrecognized codes
        new_combinations = []
        new_combinations_one_rate = []
        unrecognized_codes = []
        redis_client.delete("barcode_to_items")
        df = pd.read_excel(excel_file)
        df["Date"] = df["Date"].astype(str)
        columns = df.columns.to_list()
        current_order_number = ""
        whole_order = {
            "items": [],
            "name": "",
            "shipMethod": "",
            "shipDate": "",
            "address1": "",
            "address2": "",
            "city": "",
            "state": "",
            "zip": "",
            "oneRate": False
        }
        items_in_order = []
        for row in df.itertuples(index=True):
            #check if the row is NOT an order item
            if pd.isna(row.Num):
                #check if the order has been stored yet
                if items_in_order:
                    #store order and reset
                    whole_order["items"] = items_in_order
                    if whole_order["oneRate"]:
                        new_combinations_one_rate, unrecognized_codes = order_to_string(redis_client, new_combinations_one_rate, unrecognized_codes, current_order_number, items_in_order, True)
                    else:
                        new_combinations, unrecognized_codes = order_to_string(redis_client, new_combinations, unrecognized_codes, current_order_number, items_in_order)
                    redis_client.hset("barcode_to_items", current_order_number, json.dumps(whole_order))
                    current_order_number = ""
                    items_in_order = []
            else:
                #check if row is a new order
                if current_order_number == "":
                    whole_order = {
                    "items": [],
                    "name": "",
                    "shipMethod": "",
                    "shipDate": "",
                    "address1": "",
                    "address2": "",
                    "city": "",
                    "state": "",
                    "zip": "",
                    "oneRate": False
                }
                    current_order_number = row.Num[1:-1]
                    items_in_order = [[row.Item, row.Qty]]
                    whole_order["name"] = row.Name
                    whole_order["shipMethod"] = row.Via
                    if "one rate" in row.Via:
                        whole_order["oneRate"] = True
                    whole_order["shipDate"] = row.Date
                    whole_order["address1"] = row._26
                    whole_order["address2"] = row._28
                    whole_order["city"] = row._30
                    whole_order["state"] = row._32
                    whole_order["zip"] = row._34
                #check if order number is a different order number
                elif current_order_number != row.Num[1:-1]:                    
                    #store if different order number
                    whole_order["items"] = items_in_order
                    if whole_order["oneRate"]:
                        new_combinations_one_rate, unrecognized_codes = order_to_string(redis_client, new_combinations_one_rate, unrecognized_codes, current_order_number, items_in_order, True)
                    else:
                        new_combinations, unrecognized_codes = order_to_string(redis_client, new_combinations, unrecognized_codes, current_order_number, items_in_order)
                    redis_client.hset("barcode_to_items", current_order_number, json.dumps(whole_order))
                    current_order_number = row.Num[1:-1]
                    items_in_order = [[row.Item, row.Qty]]

                    whole_order = {
                    "items": [],
                    "name": "",
                    "shipMethod": "",
                    "shipDate": "",
                    "address1": "",
                    "address2": "",
                    "city": "",
                    "state": "",
                    "zip": "",
                    "oneRate": False
                }
                    whole_order["name"] = row.Name
                    whole_order["shipMethod"] = row.Via
                    if "one rate" in row.Via:
                        whole_order["oneRate"] = True
                    whole_order["shipDate"] = row.Date
                    whole_order["address1"] = row._26
                    whole_order["address2"] = row._28
                    whole_order["city"] = row._30
                    whole_order["state"] = row._32
                    whole_order["zip"] = row._34
                #check if item is shipping and handling
                elif "shipping and handling" in row.Item or "materials and handling" in row.Item or "third-party shipping" in row.Item or "handling fee" in row.Item or "Residential surcharge" in row.Item or "surcharge" in row.Item:
                    continue
                #another item in the order
                else:
                    #add item to order
                    items_in_order.append([row.Item, row.Qty])

        #make excel file for database
        rows_with_blanks = []
        for row in new_combinations:
            rows_with_blanks.append([row[0], row[1][1:3], row[1][3:5], row[1][5:7], row[1][7:9], row[1][9:11], row[1][11:13], row[1][13:15], row[1][15:17], row[1][17:19], row[1][19:21], None, None, None, None, None, None])
            rows_with_blanks.append([None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None])
            rows_with_blanks.append([None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None])
        for row in new_combinations_one_rate:
            rows_with_blanks.append([row[0], row[1][1:3], row[1][3:5], row[1][5:7], row[1][7:9], row[1][9:11], row[1][11:13], row[1][13:15], row[1][15:17], row[1][17:19], row[1][19:21], "x", None, None, None, None, None])
            rows_with_blanks.append([None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None])
            rows_with_blanks.append([None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None])
        df = pd.DataFrame(rows_with_blanks, columns = ["Order", "nv", "pnv", "wv", "pwv", "bt", "pbt", "smallbt", "smallpbt", "bulk", "errors","OneRate", "", "Ignore", "Box", "Items", "Notes"])
        output_file = './generated_output.xlsx'

        #make excel file for unrecognized codes
        rows_for_unrecognized_codes = []
        for row in unrecognized_codes:
            rows_for_unrecognized_codes.append([row])
        errors_df = pd.DataFrame(rows_for_unrecognized_codes, columns = ["unrecognized codes"])
        with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Main Data", index=False)
            errors_df.to_excel(writer, sheet_name="Unrecognized Codes", index=False)
        return jsonify({"status": "success! data imported",
                        "columns": columns}), 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return jsonify({
            "status": "failed",
            "error_type": error_type,
            "error_message": error_message,
        }), 500
    return jsonify({"status": "success! data imported"})

@app.route('/api/input-excel', methods=['POST'])
def input_excel():
    if 'file' not in request.files:
        return jsonify({"error": "No Excel File Provided"}), 400
    
    excel_file = request.files['file']

    try:
        df = pd.read_excel(excel_file)
        current_order = {
            "item_sizes": "",
            "boxes": [],
            "one_rate": False
        } #item_sizes and boxes. Boxes will be a list of objects of box type and items. Its ok if items is empty
        for row in df.itertuples(index=True):
            #check if Order is not empty
            if not pd.isna(row.Order):
                #if it is filled in, log the previous object if string is filled in. Log the string, as well as the boxes, and empty the current order
                if current_order.get("item_sizes", "") is not None:
                    if current_order["one_rate"]:
                        redis_client.hset("uniq_to_uniq_one_rate", current_order.get("item_sizes", ""), json.dumps(current_order.get("boxes")))
                    else:
                        redis_client.hset("uniq_to_uniq", current_order.get("item_sizes", ""), json.dumps(current_order.get("boxes")))
                current_order["boxes"] = []
                current_order["item_sizes"] = ""
                current_order["one_rate"] = False
                #check if ignore is empty
                if pd.isna(row.Ignore):
                    #If ignore is empty, Then build up the new string
                    s = "x"
                    sizes = ["nv", "pnv", "wv", "pwv", "bt", "pbt", "smallbt", "smallpbt", "bulk"]
                    for size in sizes:
                        temp = row._asdict().get(size, 69)
                        temp = int(temp)
                        if temp < 10:
                            s = s + "0"
                        s = s + str(temp)
                    s = s + "00"
                    current_order["item_sizes"] = s
                    if pd.isna(row.OneRate):
                        current_order["one_rate"] = False
                    else:
                        current_order["one_rate"] = True
                else:
                    #If ignore is filled in, continue
                    continue
            #add the box type and items in box of this row into the current_order["boxes"] list
            if pd.isna(row.Box):
                continue
            elif pd.isna(row.Items):
                box = {
                        "box": row.Box,
                        "items": ""
                    }
                current_order["boxes"].append(box)
            else:
                box = {
                    "box": row.Box,
                    "items": row.Items
                }
                current_order["boxes"].append(box)
        #loop done, last log into redis
        if current_order.get("item_sizes"):
            if current_order["one_rate"]:
                redis_client.hset("uniq_to_uniq_one_rate", current_order.get("item_sizes", ""), json.dumps(current_order.get("boxes", [])))
            else:
                redis_client.hset("uniq_to_uniq", current_order.get("item_sizes", ""), json.dumps(current_order.get("boxes", [])))
        return jsonify({
            "status": "Success! Data Logged"
        }), 200
    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)
        return jsonify({
            "status": "failed",
            "error_type": error_type,
            "error_message": error_message
        }), 500


@app.route('/api/get-order-info', methods=['POST'])
def getOrderInfo():
    #grab data from request
    data = request.get_json()
    error_part = ""
    statuses = [
        "placeholder",
        "failure. No order",
        "Error in order",
        "Error in finding boxes",
        "Success"
    ]
    current_status = statuses[4]
    item_sizes = {
        "nv": 0,
        "pnv": 0,
        "wv": 0,
        "pwv": 0,
        "bt": 0,
        "pbt": 0,
        "sbt": 0,
        "spbt": 0,
        "bulk": 0,
        "error": 0
    }
    order = redis_client.hget('barcode_to_items', data["barcode"])
    if order:
        order = json.loads(order)
        itemList = []
        items = order["items"]
        for item in items:
            space_index = item[0].find(" ")
            if space_index != -1:
                part_num = item[0][:space_index]
            else:
                part_num = item[0]
            dash_index = part_num.find('-')
            part_num = part_num[dash_index + 1:]
            plugged = False
            if part_num[0] == "P":
                plugged = True
            if "NV" in part_num:
                if plugged:
                    item_sizes["pnv"] += int(item[1])
                else:
                    item_sizes["nv"] += int(item[1])
            elif "WV" in part_num:
                if plugged:
                    item_sizes["pwv"] += int(item[1])
                else:
                    item_sizes["wv"] += int(item[1])
            elif "BT" in part_num:
                if plugged:
                    item_sizes["pbt"] += int(item[1]) // 25
                    item_sizes["spbt"] += int(item[1]) % 25
                else:
                    item_sizes["bt"] += int(item[1]) // 25
                    item_sizes["sbt"] += int(item[1]) % 25
            elif "bulk" in item[0] or "BK" in part_num:
                item_sizes["bulk"] += int(item[1])
            elif redis_client.hexists("error", item[0][:space_index]):
                temp_size = redis_client.hget("error", item[0][:space_index])
                if temp_size != "error":
                    if temp_size == "bt":
                        item_sizes["bt"] += int(item[1]) // 25
                        item_sizes["sbt"] += int(item[1]) % 25
                    elif temp_size == "pbt":
                        item_sizes["pbt"] += int(item[1]) // 25
                        item_sizes["spbt"] += int(item[1]) % 25 
                    else:
                        item_sizes[temp_size] += int(item[1])
                else:
                    error_part = item[0][:space_index]
                    current_status = statuses[2]
            itemList.append({"name": item[0], "quantity": item[1]})
        if item_sizes["sbt"] > 25:
            item_sizes["bt"] += item_sizes["sbt"] // 25
            item_sizes["sbt"] = item_sizes["sbt"] % 25
        if item_sizes["spbt"] > 25:
            item_sizes["pbt"] += item_sizes["spbt"] // 25
            item_sizes["spbt"] = item_sizes["spbt"] % 25
        extra_bt = item_sizes["spbt"] + item_sizes["sbt"]
        if item_sizes["spbt"] > 0:
            plugged = True
        else:
            plugged = False
        item_sizes["spbt"] = 0
        item_sizes["sbt"] = 0
        if extra_bt > 25:
            if plugged:
                item_sizes["pbt"] += extra_bt // 25
                extra_bt = extra_bt % 25
            else:
                item_sizes["bt"] += extra_bt // 25
                extra_bt = extra_bt % 25
        if extra_bt > 16:
            if plugged:
                item_sizes["pbt"] += 1
            else:
                item_sizes["bt"] += 1
        elif extra_bt > 0:
            if plugged:
                item_sizes["spbt"] = 1
            else:
                item_sizes["sbt"] = 1
        s = "x"
        if item_sizes["nv"] < 10:
            s += "0"
        s += str(item_sizes["nv"])
        if item_sizes["pnv"] < 10:
            s += "0"
        s += str(item_sizes["pnv"])
        if item_sizes["wv"] < 10:
            s += "0"
        s += str(item_sizes["wv"])
        if item_sizes["pwv"] < 10:
            s += "0"
        s += str(item_sizes["pwv"])
        if item_sizes["bt"] < 10:
            s += "0"
        s += str(item_sizes["bt"])
        if item_sizes["pbt"] < 10:
            s += "0"
        s += str(item_sizes["pbt"])
        if item_sizes["sbt"] < 10:
            s += "0"
        s += str(item_sizes["sbt"])
        if item_sizes["spbt"] < 10:
            s += "0"
        s += str(item_sizes["spbt"])
        if item_sizes["bulk"] < 10:
            s += "0"
        s += str(item_sizes["bulk"])
        if item_sizes["error"] < 10:
            s += "0"
        s += str(item_sizes["error"])
        boxes = redis_client.hget("uniq_to_uniq", s)
        if boxes:
            boxes = json.loads(boxes)
        elif current_status == statuses[4]:
            current_status = statuses[3]
        return jsonify({"status": current_status, "items": itemList, "error_part": error_part, "boxes": boxes, "order": order, "item_sizes": item_sizes, "part_num": part_num})
    return jsonify({'status': "failure. No items in order"})


@app.route('/api/get-item-info', methods=['POST'])
#Requires: barcode
#Returns: item name and quantity
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

        return jsonify({
                        "status": "success!",
                        "itemName": itemName,
                        "itemSize": itemSize,
                        "itemUM": itemUM,
                        "itemQuantity": itemQuantity
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


@app.route('/api/log', methods=['POST'])
def log():
    data = request.get_json()
    log = data["message"]
    timestamp_key = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]

    # Store log in Redis
    redis_client.hset("log", timestamp_key, log)

    # Tell bridge app to store this order
    order_data = redis_client.hget("barcode_to_items", data["barcode"])
    order_data = json.loads(order_data)
    redis_client.hset("bridge_app", data["barcode"], json.dumps({
        "barcode": data["barcode"],
        "boxes": data["boxes"],
        "name": order_data["name"],
        "shipMethod": order_data["shipMethod"],
        "data": order_data["shipDate"],
        "address1": order_data["address1"],
        "address2": order_data["address2"],
        "city": order_data["city"],
        "state": order_data["state"],
        "zip": order_data["zip"],
        "PO": order_data.get("PO", 0)
        }))

    return jsonify({"success": True, "timestamp": timestamp_key})


if __name__ == "__main__":
    initialize_data(overwrite=False)
    app.run(host='0.0.0.0', port=5000)
    