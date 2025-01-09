from init import redis_client
import json
from enum import Enum

#Given a string or object, return the box we want
def logic(input_string: str):
    #see if specific string is already in database
    box = redis_client.hget("uniq_to_uniq", input_string)
    box = json.loads(box)
    if box:
        return box
    else:
        #use heuristics to determine correct box
        return ["0"]