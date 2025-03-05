import React, { useState } from "react";

const Items = ( { order, items, updateItems} ) => {

    const [itemBarcode, setItemBarcode] = useState("")
    const [showPopup, setShowPopup] = useState(false)
    const [error, setError] = useState("none")

    const [newItemName, setNewItemName] = useState("")
    const [newItemSize, setNewItemSize] = useState("")
    const [newItemUM, setNewItemUM] = useState("U")
    const [newItemQuantity, setNewItemQuantity] = useState(1)
    const [disabledButton, setDisabledButton] = useState(true)

    
    const validSizes = ["nv", "pnv", "wv", "pwv", "bt", "pbt", "bulk"]


    const handleItemSubmit = async (event) => {
        if (event.key === "Enter"){
            try{
                const response = await fetch('http://localhost:5000/api/get-item-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',  // Ensure Content-Type is set to JSON
                    },
                    body: JSON.stringify({ barcode: itemBarcode })
                })

                if (response.ok) {
                    const data = await response.json()
                    /*if (data.status === "Success"){
                        updateParentBoxesList(data.boxes)
                    }*/
                    console.log(data)
                    if (data.status !== "success!"){
                        setShowPopup(!showPopup)
                    }else{
                        updateItems(data.itemName, data.itemSize, data.itemQuantity, data.itemUM)
                        setItemBarcode("")
                    }
                }else {
                    console.error("API Error:", response.statusText)
                }
            }catch(error){
                console.error("Error sending barcode:", error)
            }
        }
    }

    const handleSubmitNewItem = async (e) => {
        try{
            const response = await fetch("http://localhost:5000/api/new-item-barcode", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    barcode: itemBarcode, 
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



    return (
        <div>
            <div className="h-1/4">
                <label className="block text-sm font-medium text-gray-700">Item Barcode</label>
                <input
                    id="order-barcode"
                    type="text"
                    value={itemBarcode}
                    onChange={(e) => setItemBarcode(e.target.value)}
                    onKeyDown={handleItemSubmit}
                    placeholder="Enter Order Barcode"
                    className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"

                />
            </div>

            {showPopup && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-md shadow-md w-96">
                        <h2 className="text-lg font-bold mb-4">Add New Item</h2>

                        {/* Input for Barcode */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Barcode</label>
                            <input
                                type="text"
                                value={itemBarcode}
                                onChange={(e) => setItemBarcode(e.target.value)}
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
                <div className="p-4 bg-white rounded-md shadow-md">
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
                            {items.map((item) => (
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
    ) 
}

export default Items;