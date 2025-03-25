from init import redis_client
import json
from enum import Enum


# For a mapping between the name of the size and the place it goes in the string
ref = {}
ref["nf"] = 0
ref["nfp"] = 1
ref["wf"] = 2
ref["wfp"] = 3
ref["bt"] = 4
ref["btp"] = 5
ref["bulk"] = 6


# For a Backwards REFerence mapping between the place in the string and the name of the size (as well as the name of the table in the database)
bref = {}
bref[0] = "nf"
bref[1] = "nfp"
bref[2] = "wf"
bref[3] = "wfp"
bref[4] = "bt"
bref[5] = "btp"
bref[6] = 'bulk'

def toTwelve(s: str):
    if len(s) == 15: return s
    temp = ""
    for char in s:
        temp += char
        temp += "0"
    return temp[:-1]

# Check if a group (nf, nfp or wf, wfp or bt, btp) is actually a single category
# output = [1, 3] representing the index number of the size (1 = nfp) and the number of that size (3)
def checkIfSingle(s:str):
    count = 0
    ans = []
    index = 1
    if len(s) > 8:
        while index < len(s):
            if s[index:index+2] != "00":
                count+=1
                if count > 1:
                    return [-1, 0]
                else: 
                    ans = [int(index/2), s[index:index+2]]
            index += 2
        return ans
    while index < len(s):
        if s[index] != "0":
            count+=1
            if count > 1:
                return [-1, 0]
            else: 
                ans = [index - 1, "0" + s[index]]
        index += 1
    return ans
    
                
# Chops a string into 3 strings. x112233 becomes x110000 x002200 x000033
# output = list of the 3 strings
def chopper(s: str):
    if len(s) > 9:
        ans = ["x" for x in range(3)]
        ans[0] = ans[0] + s[1:5] + "00000000"
        ans[1] = ans[1] + "0000" + s[5:9] + "0000"
        ans[2] = ans[2] + "00000000" + s[9:]
        return ans
    ans = ["x" for x in range(3)]
    ans[0] = ans[0] + s[1:3] + "0000"
    ans[1] = ans[1] + "00" + s[3:5] + "00"
    ans[2] = ans[2] + "0000" + s[5:]
    return ans

# Picture to Barcode to Items to Sizes to Boxes
# output = size_count (x123456) and items_dic (dictionary of all items in the order)
def barcodeOutput(s: str):
    double_digit = False
    items_json = redis_client.hget("barcode_to_items", s)
    items_list = json.loads(items_json) if items_json else []
    count = 0
    items_dic = {}
    size_count = [0 for i in range(6)]
    while count < len(items_list):
        items_dic[items_list[count]] = int(items_list[count + 1])
        count += 2
    for key, val in items_dic.items():
        vial = redis_client.hget("item_barcode_info", key)
        size_count[ref[vial]] += val
        if size_count[ref[vial]] > 9:
            double_digit = True
    ans = "x"
    for size in size_count:
        temp = str(size)
        if len(temp) == 1 and double_digit:
            ans += "0"
        ans += temp
    return ans, items_dic
        

# Barcode to Items to Sizes to Boxes
# output = a list of boxes to be rendered by the front end
def directOutput(s: str):
    ans = []
    first_check = redis_client.hget("uniq_to_uniq", s)
    # Check if unique string is in database
    if first_check is None:
        # If not, chop up into groups
        second_checklist = chopper(s)
        for group in second_checklist:
            # Ignore if group does not exist
            if group == "x000000" or group == "x000000000000":
                continue
            else:
                # Check if the group is just one kind
                single_list = checkIfSingle(group)
                if single_list[0] >= 0:
                    # If single, add the single type
                    third_check = redis_client.hget(bref[single_list[0]], single_list[1])
                    third_list = json.loads(third_check)
                    ans.append(third_list)
                else:   
                    # Otherwise if not single, check if the group exists in the unique database
                    second_check = redis_client.hget("uniq_to_uniq", group)
                    if second_check is None:
                        # If group not in database, loop through the group to add each individual type
                        index = 1
                        size_num = 0
                        if len(group) > 8:
                            # Start looping through group
                            while index < len(group):
                                if group[index : index + 2] == "00":
                                    x = 1
                                else:
                                    third_check = redis_client.hget(bref[size_num], group[index : index + 2])
                                    third_list = json.loads(third_check)
                                    ans.append(third_list)
                                index += 2
                                size_num += 1
                        
                        while index < len(group):
                            if group[index] == "0":
                                x = 1
                            else:
                                third_check = redis_client.hget(bref[size_num], "0" + group[index])
                                third_list = json.loads(third_check)
                                ans.append(third_list)
                            index += 1
                            size_num += 1
                    else:
                        second_list = json.loads(second_check)
                        ans.append(second_list)
    else:
        temp = json.loads(first_check)
        for box in temp:
            ans.append(box)
    return ans


#check if string is in the list[1] of lists (if a string is already in a newCombination list)
def check_if_string_in_list_of_list(s, nc):
    exists = any( sublist[1] == s for sublist in nc )
    return exists


#turn order into a string. x123456789. Add it to the new_combinations list if it is new. 
def order_to_string(redis_client, nc, unrecognized_codes, order_num, c):
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
    for item in c:
        space_index = item[0].find(' ')
        if space_index != -1:
            item[0] = item[0][:space_index]
            part_num = item[0][:space_index]
            dash_index = part_num.rfind("-")
            if dash_index != -1:
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
                elif "bulk" in item[0] or "BK" in part_num or "bulk" in item[0]:
                    item_sizes["bulk"] += int(item[1])
                else:
                    #if unrecognized, look for the item number in the "error" field of redis
                    temp_size = redis_client.hget("error", item[0])
                    if temp_size:
                        #if found, add it to the correct one
                        item_sizes[temp_size] += 1
                    else:
                        #if not, add it to the unrecognized codes list
                        item_sizes["error"] += 1
                        redis_client.hset("error", item[0], "error")
                        unrecognized_codes.append(item[0])
            else:
                #if unrecognized, look for the item number in the "error" field of redis
                temp_size = redis_client.hget("error", item[0])
                if temp_size:
                    #if found, add it to the correct one
                    item_sizes[temp_size] += 1
                else:
                    #if not, add it to the unrecognized codes list
                    item_sizes["error"] += 1
                    redis_client.hset("error", item[0], "error")
                    unrecognized_codes.append(item[0])
        else:
            #if unrecognized, look for the item number in the "error" field of redis
            temp_size = redis_client.hget("error", item[0])
            if temp_size:
                #if found, add it to the correct one
                item_sizes[temp_size] += 1
            else:
                #if not, add it to the unrecognized codes list
                item_sizes["error"] += 1
                redis_client.hset("error", item[0], "error")
                unrecognized_codes.append(item[0])
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
    if item_sizes["error"] > 0:
        nc.insert(0,[order_num, s])
    elif redis_client.hexists("uniq_to_uniq", s):
        pass
    elif check_if_string_in_list_of_list(s, nc):
        pass
    else:
        nc.append([order_num, s])
    return nc, unrecognized_codes