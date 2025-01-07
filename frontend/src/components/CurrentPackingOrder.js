import React, { useState } from "react";
import boxImage from '../assets/openBox.png'

const CurrentPackingOrder = () => {
    const [boxType, setBoxType] = useState('Small Box'); // Example variable text
    const [barcode, setBarcode] = useState('')
    const [itemList, setItemList] = useState([])
    const [idCounter, setIdCounter] = useState(1)
    const [showPopup, setShowPopup] = useState(false)
    const [newItemName, setNewItemName] = useState("")
    const [newItemSize, setNewItemSize] = useState("")
    const [disabledButton, setDisabledButton] = useState(true)
    const [error, setError] = useState("none")


    const validSizes = ["nv", "nvp", "wv", "wvp", "bt", "btp"]
  
    const addOrUpdateItem = (itemName, quantity = 1) => {
        setItemList((prevList) => {
            const existingItem = prevList.find((item) => item.item_name === itemName)

            if (existingItem){
                return prevList.map((item) => 
                    item.item_name === itemName 
                    ? {...item, quantity:item.quantity + quantity}
                    : item
                )
            }

            const newItem = {
                id: idCounter,
                item_name: itemName,
                quantity
            }
            setIdCounter((prevId) => prevId + 1)
            return [...prevList, newItem]
        })
    }

    const handleSubmitNewItem = async (e) => {
        try{
            console.log(barcode)
            const response = await fetch("http://localhost:5000/api/new-item-barcode", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    barcode: barcode, 
                    itemName: newItemName,
                    itemSize: newItemSize
                })
            })

            if (response.ok){
                const data = await response.json()
                console.log(data.status)
                setShowPopup(false)
                setNewItemName("")
                setNewItemSize("")
                setBarcode("")
            }
        }catch{
            console.error("bad new item barcode submission", 407)
        }
    }

    const handleInputChange = async (e) => {
        const value = e.target.value
        setBarcode(value)
        if (value.length === 8){
            
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
                    console.log(data)
                    if (data.status !== "success!"){
                        console.log("Not an Item", value)
                        setShowPopup(!showPopup)
                        console.log(value)
                    }else{
                        addOrUpdateItem(data.itemName, 1)
                        console.log(itemList, value)}
                        setBarcode("")
                    
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

                        {/* Input for Quantity */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="text"
                                value={newItemSize}
                                onChange={(e) => {
                                    setNewItemSize(e.target.value)
                                    setDisabledButton(!validSizes.includes(e.target.value))}}
                                placeholder="Enter size (Only nv, nvp, wv, wvp, bt, btp)"
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
                <div className="w-1/4 p-4 bg-white rounded-md shadow-md flex flex-col space-y-4">
                    <div className="p-4 bg-gray-50 rounded-md shadow">
                        <input 
                            id='barcode-input'
                            value={barcode}
                            className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:border-blue-500 hover:border-blue-300" 
                            placeholder="Type here..." 
                            type="text"
                            onChange={handleInputChange}/>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md shadow flex items-center justify-center">
                        {/* Box Image */}
                        <img
                            src={boxImage}
                            alt="Cardboard Box"
                            className="w-48 h-48 object-cover mb-2"
                        />
                        {/* Variable Text */}
                        <p className="text-gray-800 text-lg font-semibold">{boxType}</p>
                    </div>
                </div>
                {/* Right column */}
                <div className="flex-1 p-4 bg-white rounded-md shadow-md">
                    <div className="flex flex-col space-y-2">
                    <table class="w-full text-left table-auto min-w-max">
                        <thead>
                        <tr>
                            <th class="p-4 border-b border-blue-gray-100 bg-blue-gray-50">
                            <p class="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
                                Item Name
                            </p>
                            </th>
                            <th class="p-4 border-b border-blue-gray-100 bg-blue-gray-50">
                            <p class="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
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
                                                item.id % 2 === 0 ? "bg-blue-gray-50/50" : ""}`}
                                >
                                    <td className="p-4"><p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">{item.item_name}</p></td>
                                    <td className="p-4"><p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">{item.quantity}</p></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CurrentPackingOrder;