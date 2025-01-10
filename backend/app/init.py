import redis
import os
import json

redis_host = "18.116.41.16"
redis_port = 6379
redis_password = "JinhongHuimin01#redis"
redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True, password=redis_password)

def initialize_data(overwrite=False):
    print(overwrite)
    if redis_client.exists("barcode_to_items") and not overwrite:
        print("Data Not Overwritten")
        return
    
    redis_client.flushall()
    # Order Barcode -> Items
    redis_client.hset("barcode_to_items", "0005000003266", json.dumps(["item1", "1", "item2", "4", "item3", "2", "item4", "2", "item5", "2", "item6", "2"]))

    # Item Barcode -> Item size
    # redis_client.hset("item_barcode_info", barcode number, json.dumps({"itemName": "", "itemSize": "",}))
    redis_client.hset("item_barcode_info", "00000001", json.dumps({"itemName": "first item", "itemSize": "nvp"}))
    redis_client.hset("item_barcode_info", "item2", "nfp")
    redis_client.hset("item_barcode_info", "item3", "wf")
    redis_client.hset("item_barcode_info", "item4", "wfp")
    redis_client.hset("item_barcode_info", "item5", "bt")
    redis_client.hset("item_barcode_info", "item6", "btp")

    # UNIQ Collections of Sizes -> UNIQ Collections of Boxes
    # key=x010203040506 OR
    # key=x123456
    redis_client.hset("uniq_to_uniq", "x000000000000", json.dumps(["None"]))
    redis_client.hset("uniq_to_uniq", "x000000", json.dumps(["None"]))

    # General Item 1 -> General Boxes 1
    redis_client.hset("nf", "01", json.dumps(["11x11x5"]))
    redis_client.hset("nf", "02", json.dumps(["11x11x8"]))
    redis_client.hset("nf", "03", json.dumps(["nv box"]))
    redis_client.hset("nf", "04", json.dumps(["nv box"]))
    redis_client.hset("nf", "05", json.dumps(["nv box"]))
    redis_client.hset("nf", "06", json.dumps(["22x12x10"]))
    redis_client.hset("nf", "07", json.dumps(["(cut) nv-10 box"]))
    redis_client.hset("nf", "08", json.dumps(["(cut) nv-10 box"]))
    
    # General Item 2 -> General Boxes 2
    redis_client.hset("nfp", "01", json.dumps(["11x11x5"]))
    redis_client.hset("nfp", "02", json.dumps(["11x11x10"]))
    redis_client.hset("nfp", "03", json.dumps(["nv box"]))
    redis_client.hset("nfp", "04", json.dumps(["nv box"]))
    redis_client.hset("nfp", "05", json.dumps(["22x14x10 w pillows"]))
    redis_client.hset("nfp", "06", json.dumps(["22x14x10 (3+3, two bags)"]))
    redis_client.hset("nfp", "07", json.dumps(["nv-10 box"]))
    redis_client.hset("nfp", "08", json.dumps(["nv-10 box"]))
    
    # General Item 3 -> General Boxes 3
    redis_client.hset("wf", "01", json.dumps(["12x12x4"]))
    redis_client.hset("wf", "02", json.dumps(["12x12x8"]))
    redis_client.hset("wf", "03", json.dumps(["wv box cut"]))
    redis_client.hset("wf", "04", json.dumps(["wv box cut"]))
    redis_client.hset("wf", "05", json.dumps(["wv box"]))
    redis_client.hset("wf", "06", json.dumps(["12x12x24"]))
    redis_client.hset("wf", "07", json.dumps([""]))
    redis_client.hset("wf", "08", json.dumps(["wv-10 box cut"]))
    
    # General Item 4 -> General Boxes 4
    redis_client.hset("wfp", "01", json.dumps(["12x12x5"]))
    redis_client.hset("wfp", "02", json.dumps(["12x12x10"]))
    redis_client.hset("wfp", "03", json.dumps(["12x12x16 or cut xv-5 box"]))
    redis_client.hset("wfp", "04", json.dumps(["wv box"]))
    redis_client.hset("wfp", "05", json.dumps(["12x12x24"]))
    ########vvvvvvv
    redis_client.hset("wfp", "06", json.dumps(["24x12x14 (3+3, two bags)"]))
    ########^^^^^^^
    redis_client.hset("wfp", "07", json.dumps(["wv-10 box"]))
    redis_client.hset("wfp", "08", json.dumps(["2 boxes of wv-5"]))
    
    # General Item 5 -> General Boxes 5
    redis_client.hset("bt", "01", json.dumps(["12x12x5"]))
    redis_client.hset("bt", "02", json.dumps(["12x12x10"]))
    redis_client.hset("bt", "03", json.dumps(["24x12x10 w empty tray"]))
    redis_client.hset("bt", "04", json.dumps(["24x12x10"]))
    redis_client.hset("bt", "05", json.dumps([""]))
    redis_client.hset("bt", "06", json.dumps([""]))
    redis_client.hset("bt", "07", json.dumps([""]))
    redis_client.hset("bt", "08", json.dumps(["wv-10 box"]))
    
    # General Item 6 -> General Boxes 6
    redis_client.hset("btp", "01", json.dumps(["12x12x5"]))
    redis_client.hset("btp", "02", json.dumps(["12x12x10"]))
    redis_client.hset("btp", "03", json.dumps(["24x12x10 w empty tray"]))
    redis_client.hset("btp", "04", json.dumps(["24x12x10 (2+2, two bags)"]))
    redis_client.hset("btp", "05", json.dumps([""]))
    redis_client.hset("btp", "06", json.dumps([""]))
    redis_client.hset("btp", "07", json.dumps([""]))
    redis_client.hset("btp", "08", json.dumps(["wv-10 box"]))



