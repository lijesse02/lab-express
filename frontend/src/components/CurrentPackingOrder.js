import React, { useState } from "react";
import boxImage from '../assets/openBox.png'
import ItemsInOrder from './ItemsInOrder'

const CurrentPackingOrder = () => {
    //Displayed Info (item side)
    const [boxType, setBoxType] = useState('Small Box');
    const [itemList, setItemList] = useState([])
    const [error, setError] = useState("none")
    const [idCounter, setIdCounter] = useState(1)
    const [keyCounterIIO, setKeyCounterIIO] = useState(0)

    //Popup for Adding Item
    const [showPopup, setShowPopup] = useState(false)
    const [disabledButton, setDisabledButton] = useState(true)
    
    //Textbox and API variables
    const [barcode, setBarcode] = useState('')
    const [newItemName, setNewItemName] = useState("")
    const [newItemSize, setNewItemSize] = useState("")
    const [newItemUM, setNewItemUM] = useState("U")
    const [newItemQuantity, setNewItemQuantity] = useState(1)
    

    const validSizes = ["nv", "pnv", "wv", "pwv", "bt", "pbt", "bulk"]
  
    const addOrUpdateItem = (itemName, itemSize, itemQuantity=1, itemUM) => {
        setItemList((prevList) => {
            const existingItem = prevList.find((item) => item.item_name === itemName)

            if (existingItem){
                return prevList.map((item) => 
                    item.item_name === itemName 
                    ? {...item, item_quantity:item.item_quantity + Number(itemQuantity)}
                    : item
                )
            }

            const newItem = {
                id: idCounter,
                item_name: itemName,
                item_size: itemSize,
                item_quantity: Number(itemQuantity),
                item_um: itemUM
            }
            setIdCounter((prevId) => prevId + 1)
            return [...prevList, newItem]
        })
    }

    const handleClear = () => {
        setItemList([])
        setKeyCounterIIO((prevKey) => prevKey + 1)
        setBoxType("None")
    }

    const handleSubmitNewItem = async (e) => {
        try{
            const response = await fetch("http://localhost:5000/api/new-item-barcode", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    barcode: barcode, 
                    itemName: newItemName,
                    itemSize: newItemSize,
                    itemUM: newItemUM,
                    itemQuantity: newItemQuantity
                })
            })

            if (response.ok){
                const data = await response.json()
                setShowPopup(false)
                setNewItemName("")
                setNewItemSize("")
                setBarcode("")
                setNewItemQuantity(1)
                setNewItemUM("U")
            }
        }catch{
            console.error("bad new item barcode submission", 407)
        }
    }

    const handleInputChange = async (e) => {
        const value = e.target.value
        setBarcode(value)
        if (value.length === 14){
            
            try{
                const response = await fetch('http://localhost:5000/api/get-item-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',  // Ensure Content-Type is set to JSON
                    },
                    body: JSON.stringify({ barcode: value, items: itemList })
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log(data.sizeList)
                    console.log(itemList)
                    if (data.status !== "success!"){
                        setShowPopup(!showPopup)
                    }else{
                        addOrUpdateItem(data.itemName, data.itemSize, data.itemQuantity, data.itemUM)
                        setBoxType(data.boxes)
                        setBarcode("")
                    }
                    
                }else {
                    console.error("API Error:", response.statusText)
                }
            }catch(error){
                console.error("Error sending barcode:", error)
            }
        }
    }

    return (
        <div>
            {showPopup && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-md shadow-md w-96">
                        <h2 className="text-lg font-bold mb-4">Add New Item</h2>

                        {/* Input for Barcode */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Barcode</label>
                            <input
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Enter Barcode"
                                className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                            />
                        </div>
                        
                        {/* Input for Item Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Item Name</label>
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Enter item name"
                                className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                            />
                        </div>

                        {/* Input for U/M and Quantity */}
                        <div className="mb-4">
                            {/* U/M */}
                            <label className="block text-sm font-medium text-gray-700">U/M</label>
                            <input
                                type="text"
                                value={newItemUM}
                                onChange={(e) => {
                                    setNewItemUM(e.target.value)
                                   }}
                                placeholder="Default: U"
                                className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                            />

                            {/* Quantity */}
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="text"
                                value={newItemQuantity}
                                onChange={(e) => {
                                    setNewItemQuantity(e.target.value)
                                   }}
                                placeholder="Default: 1"
                                className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                            />
                        </div>

                        {/* Input for Size */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Size</label>
                            <input
                                type="text"
                                value={newItemSize}
                                onChange={(e) => {
                                    setNewItemSize(e.target.value)
                                    setDisabledButton(!validSizes.includes(e.target.value))}}
                                placeholder="Enter size (Only nv, pnv, wv, pwv, bt, pbt, bulk)"
                                className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitNewItem}
                                disabled={disabledButton}
                                className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 ${disabledButton ? "cursor-not-allowed" : ""}`}
                            >
                                Submit
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && <p className="text-red-500 text-sm mt-4"></p>}
                    </div>
                </div>
            )}


            <div className="flex space-x-4">
                {/* Left column */}
                <div className="w-3/5 rounded-md p-4 shadow-md">
                    {/* Clear Button */}
                    <button
                        onClick={handleClear}
                        className="block mx-auto w-full h-16 px-4 py-2 bg-emerald-300 text-white rounded hover:bg-green-500"
                    >
                        Clear
                    </button>
                    {/* Order Table */}
                    <ItemsInOrder key={keyCounterIIO} parentItemList={itemList}/>
                </div>
                {/* Right Column */}
                <div className="w-2/5 p-4 bg-white rounded-md shadow-md flex flex-col space-y-4">
                    {/* Top Row */}
                    <div className="flex h-16">
                        {/* Barcode Input */}
                        <div className="flex-col w-2/5 text-center">
                            <label className="block text-sm font-medium text-gray-700">Item Barcode</label>
                            <div className="">
                                <input 
                                    id='barcode-input'
                                    value={barcode}
                                    className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border rounded-md px-3 py-2 transition duration-300 ease focus:border-blue-500 hover:border-blue-300" 
                                    placeholder="Type here..." 
                                    type="text"
                                    onChange={handleInputChange}/>
                            </div>
                        </div>
                        <div className="flex-col w-3/5 text-center">
                            {/* Variable Text */}
                            <label className="block text-sm font-medium text-gray-700">Boxes:</label>
                            <p className="text-center text-lg font-semibold">{boxType}</p>
                        </div>
                    </div>
                    {/* Bottom Row */}
                    <div className="flex-grow bg-white rounded-md shadow-md">
                        <div className="flex flex-col space-y-2">
                        <table className="w-full text-left table-auto min-w-max">
                            <thead>
                            <tr>
                                <th className="p-4 border-b border-gray-100 bg-gray-100">
                                <p className="block font-sans text-sm antialiased font-normal leading-none  opacity-70">
                                    Item Name
                                </p>
                                </th>
                                <th className="p-4 border-b border-gray-100 bg-gray-100">
                                <p className="block font-sans text-sm antialiased font-normal leading-none opacity-70">
                                    Quantity
                                </p>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                                {itemList.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`${
                                                    item.id % 2 === 0 ? "bg-gray-50" : ""}`}
                                    >
                                        <td className="p-4"><p className="block font-sans text-sm antialiased font-normal leading-normal">{item.item_name}</p></td>
                                        <td className="p-4"><p className="block font-sans text-sm antialiased font-normal leading-normal">{item.item_quantity}</p></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>                
            </div>
        </div>
    )
}

export default CurrentPackingOrder;