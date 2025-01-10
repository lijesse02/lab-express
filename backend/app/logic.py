from init import redis_client
import json
from enum import Enum

#Given a string or object, return the box we want
def logic(input_string: str):
    #see if specific string is already in database
    box = redis_client.hget("uniq_to_uniq", input_string)
    if box:
        box = json.loads(box)
        return box
    else:
        #use heuristics to determine correct box
        return ["0"]
    
def logic(input_dic: dict):
    s = "x"
    if input_dic["nv"] < 10:
        s += "0"
    s += input_dic["nv"]
    if input_dic["nvp"] < 10:
        s += "0"
    s += input_dic["nvp"]
    if input_dic["wv"] < 10:
        s += "0"
    s += input_dic["wv"]
    if input_dic["wvp"] < 10:
        s += "0"
    s += input_dic["wvp"]
    if input_dic["bt"] < 10:
        s += "0"
    s += input_dic["bt"]
    if input_dic["btp"] < 10:
        s += "0"
    s += input_dic["btp"]
    return logic(s)