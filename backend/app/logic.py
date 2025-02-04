from init import redis_client
import json
from enum import Enum

nv_boxes = ["11 x 11 x 5", "11 x 11 x 8", "nv box", "nv box", "nv box", "22 x 12 x 10", "(cut) nv-10 box", "(cut) nv-10 box"]
pnv_boxes = ["11 x 11 x 5", "11 x 11 x 10", "nv box", "nv box", "22 x 14 x 10 w pillows", "22 x 14 x 10 (3 + 3, two bags)", "nv-10 box", "nv-10 box"]
wv_boxes = ["12 x 12 x 4", "12 x 12 x 8", "wv box cut", "wv box cut", "wv box", "12 x 12 x 24", "NEEDS FIX", "wv-10 box cut"]
pwv_boxes = ["12 x 12 x 5", "12 x 12 x 10", "12 x 12 x 16 or cut wv-5 box", "wv box", "12 x 12 x 24", "wv-10 box cut", "wv-10 box", "wv-5 box X2", "", "", ]
bt_boxes = ["12 x 12 x 5", "12 x 12 x 10", "24 x 12 x 10 w empty tray", "24 x 12 x 10", "NEEDS FIX", "NEEDS FIX", "NEEDS FIX", "wv-10 box"]
pbt_boxes = ["12 x 12 x 5", "12 x 12 x 10", "24 x 12 x 10 w empty tray", "24 x 12 x 10 (2+2, two bags)", "NEEDS FIX", "NEEDS FIX", "NEEDS FIX", "wv-10 box"]
bulk_boxes = []

one_item_type = {
    "nv": nv_boxes,
    "pnv": pnv_boxes,
    "wv": wv_boxes,
    "pwv": pwv_boxes,
    "bt": bt_boxes,
    "pbt": pbt_boxes,
    "bulk": bulk_boxes
}


def makeStringFromDict(input_dic):
    s = "x"
    if input_dic["nv"] < 10:
        s += "0"
    s += str(input_dic["nv"])
    if input_dic["pnv"] < 10:
        s += "0"
    s += str(input_dic["pnv"])
    if input_dic["wv"] < 10:
        s += "0"
    s += str(input_dic["wv"])
    if input_dic["pwv"] < 10:
        s += "0"
    s += str(input_dic["pwv"])
    if input_dic["bt"] < 10:
        s += "0"
    s += str(input_dic["bt"])
    if input_dic["pbt"] < 10:
        s += "0"
    s += str(input_dic["pbt"])
    if input_dic["bulk"] < 10:
        s += "0"
    s += str(input_dic["bulk"])
    return s

#Given a string or object, return the box we want
def logic(input_string: str):
    #create dict
    input_dict = {
        "nv": int(input_string[1:3]),
        "pnv": int(input_string[3:5]),
        "wv": int(input_string[5:7]),
        "pwv": int(input_string[7:9]),
        "bt": int(input_string[9:11]),
        "pbt": int(input_string[11:13]),
        "bulk": int(input_string[13:])
    }
    return logicDict(input_dict)

def logicDict(input_dic: dict):
    #Get all keys with non zero value
    keys_in_order = ["nv", "pnv", "wv", "pwv", "bt", "pbt", "bulk"]
    keys_in_order = [key for key in keys_in_order if input_dic[key] > 0]

    #Check if only 1 type of item
    if len(keys_in_order) == 1:
        if input_dic[keys_in_order[0]] <= 8:
            return [str(one_item_type.get(keys_in_order[0])[input_dic.get(keys_in_order[0]) - 1])]
        else:
            boxes = []
            while input_dic[keys_in_order[0]] > 8:
                boxes.append(str(one_item_type.get(keys_in_order[0])[7]))
                input_dic[keys_in_order[0]] -= 8
            if input_dic[keys_in_order[0]] > 0:
                boxes.append(str(one_item_type.get(keys_in_order[0])[input_dic[keys_in_order[0]] - 1]))
            return boxes
    
    #get string from dict
    s = makeStringFromDict(input_dic)

    #see if specific string is already in database
    stored_boxes = redis_client.hget("uniq_to_uniq", s)
    if stored_boxes:
        stored_boxes = json.loads(stored_boxes)
        return stored_boxes
    else:
        #use heuristics to determine correct boxes
        boxes = []

        #Get rid of all bottle trays, plugged bottle trays, and bulk jars in this while loop
        #Make sure to actually change input_dic
        while input_dic.get("bulk", 0) + input_dic.get("bt", 0) + input_dic.get("pbt", 0) > 0:
            if input_dic.get("bt", 0) > 8:
                input_dic["bt"] -= 8
                boxes.append("25 x 13 x 21")
            if input_dic.get("pbt", 0) > 8:
                input_dic["pbt"] -= 8
                boxes.append("25 x 13 x 21")

            if input_dic["bt"] == 7:
                input_dic["bt"] = 0
                boxes.append("25 x 13 x 21")
            elif input_dic["bt"] <= 6:
                input_dic["bt"] = 0
                boxes.append("FIX BT UNDER 7")

            if input_dic["pbt"] == 7:
                input_dic["pbt"] = 0
                boxes.append("25 x 13 x 21")
            elif input_dic['pbt'] <= 6:
                input_dic['pbt'] = 0
                boxes.append("FIX PBT UNDER 7")
            
            if input_dic['bulk'] > 0:
                input_dic["bulk"] = 0
                boxes.append("FIX BULK")

        #Check if remaining is already in database, without bottle trays and bulk jars
        stored_boxes = redis_client.hget("uniq_to_uniq", makeStringFromDict(input_dic))
        if stored_boxes:
            return boxes + json.loads(stored_boxes)
        
        else:
            # If not, get rid of any nv, pnv, wv, pwv above 8
            for key, value in input_dic.items():
                while input_dic[key] > 8:
                    input_dic[key] -= 8
                    boxes.append(one_item_type.get(key)[7])
            
            # Check again if the new input dic with values all below 8 is in the database already
            stored_boxes = redis_client.hget("uniq_to_uniq", makeStringFromDict(input_dic))
            if stored_boxes:
                return boxes + json.loads(stored_boxes)
            else:
                #Assume this will be in the database
                boxes.append("ADD THIS TO DATABASE:" + str(input_dic))
                return boxes
                

            
    