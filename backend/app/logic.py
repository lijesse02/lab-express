from init import redis_client
import json
from enum import Enum

nv_boxes = ["11 x 11 x 5", "11 x 11 x 8", "nv box", "nv box", "nv box", "22 x 12 x 10", "(cut) nv-10 box", "(cut) nv-10 box"]
nvp_boxes = ["11 x 11 x 5", "11 x 11 x 10", "nv box", "nv box", "22 x 14 x 10 w pillows", "22 x 14 x 10 (3 + 3, two bags)", "nv-10 box", "nv-10 box"]
wv_boxes = ["12 x 12 x 4", "12 x 12 x 8", "wv box cut", "wv box cut", "wv box", "12 x 12 x 24", "NEEDS FIX", "wv-10 box cut"]
wvp_boxes = ["12 x 12 x 5", "12 x 12 x 10", "12 x 12 x 16 or cut wv-5 box", "wv box", "12 x 12 x 24", "wv-10 box cut", "wv-10 box", "wv-5 box X2", "", "", ]
bt_boxes = ["12 x 12 x 5", "12 x 12 x 10", "24 x 12 x 10 w empty tray", "24 x 12 x 10", "NEEDS FIX", "NEEDS FIX", "NEEDS FIX", "wv-10 box"]
btp_boxes = ["12 x 12 x 5", "12 x 12 x 10", "24 x 12 x 10 w empty tray", "24 x 12 x 10 (2+2, two bags)", "NEEDS FIX", "NEEDS FIX", "NEEDS FIX", "wv-10 box"]

one_item_type = {
    "nv": nv_boxes,
    "nvp": nvp_boxes,
    "wv": wv_boxes,
    "wvp": wvp_boxes,
    "bt": bt_boxes,
    "btp": btp_boxes,
}


#Given a string or object, return the box we want
def logic(input_string: str):
    #create dict
    input_dict = {
        "nv": int(input_string[1:3]),
        "nvp": int(input_string[3:5]),
        "wv": int(input_string[5:7]),
        "wvp": int(input_string[7:9]),
        "bt": int(input_string[9:11]),
        "btp": int(input_string[11:]),
    }
    return logicDict(input_dict)

def logicDict(input_dic: dict):
    #Get all keys with non zero value
    keys_in_order = ["nv", "nvp", "wv", "wvp", "bt", "btp"]
    keys_in_order = [key for key in keys_in_order if input_dic[key] > 0]

    #Check if only 1 type of item
    if len(keys_in_order) == 1:
        if input_dic[keys_in_order[0]] < 8:
            return [str(one_item_type.get(keys_in_order[0])[input_dic.get(keys_in_order[0])])]
        else:
            return ["0"]
    s = "x"
    if input_dic["nv"] < 10:
        s += "0"
    s += str(input_dic["nv"])
    if input_dic["nvp"] < 10:
        s += "0"
    s += str(input_dic["nvp"])
    if input_dic["wv"] < 10:
        s += "0"
    s += str(input_dic["wv"])
    if input_dic["wvp"] < 10:
        s += "0"
    s += str(input_dic["wvp"])
    if input_dic["bt"] < 10:
        s += "0"
    s += str(input_dic["bt"])
    if input_dic["btp"] < 10:
        s += "0"
    s += str(input_dic["btp"])

    #see if specific string is already in database
    box = redis_client.hget("uniq_to_uniq", s)
    if box:
        box = json.loads(box)
        return box
    else:
        #use heuristics to determine correct box
        return ["0"]
    