import React, { useState, useEffect } from "react";

const ItemsInOrder = ({ parentItemList }) => {
    const [barcode, setBarcode] = useState("")
    const [showBarcodeInput, setShowBarcodeInput] = useState(true)
    const [orderList, setOrderList] = useState([])

    useEffect(() => {
        setOrderList((prevList) => {
            const updatedList = [...prevList]

            parentItemList.forEach((parentItem) => {
                const existingItem = updatedList.find((item) => item.product.startsWith(parentItem.item_name))

                if(existingItem){
                    existingItem.remaining = existingItem.quantity - parentItem.item_quantity
                }else{
                    updatedList.push({
                        product: parentItem.item_name,
                        quantity: 0,
                        remaining: 0 - Number(parentItem.item_quantity)
                    })
                }
            })

            return updatedList
        })
    }, [parentItemList])

    const handleInputChange = async (e) => {
        const value = e.target.value
        setBarcode(value)
        if (value.length === 6){
            
            try{
                const response = await fetch('https://jesse-li.dev/backend/api/get-order-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',  // Ensure Content-Type is set to JSON
                    },
                    body: JSON.stringify({ barcode: value })
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log(data.items)
                    setShowBarcodeInput(false)
                    const items = data.items.map((item) => ({
                        product: item.name,
                        quantity: item.quantity,
                        remaining: item.quantity
                    }))
                    setOrderList(items)
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
            {showBarcodeInput && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Order Barcode</label>
                    <input
                        id="order-barcode"
                        type="text"
                        value={barcode}
                        onChange={handleInputChange}
                        placeholder="Enter Barcode"
                        className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                    />
                </div>
            )}
            {!showBarcodeInput && (
                <div className="p-4 bg-white rounded-md shadow-md flex flex-col">
                    <table className="w-auto text-left table-auto">
                        <thead>
                        <tr>
                            <th className="p-4 border-b border-gray-100 bg-gray-100">
                            <p className="block font-sans text-sm antialiased font-normal leading-none  opacity-70">
                                Item Name
                            </p>
                            </th>
                            <th className="w-1/10 p-4 border-b border-gray-100 bg-gray-100">
                            <p className="block font-sans text-sm antialiased font-normal leading-none opacity-70">
                                Quantity
                            </p>
                            </th>
                            <th className="w-1/10 p-4 border-b border-gray-100 bg-gray-100">
                            <p className="block font-sans text-sm antialiased font-normal leading-none opacity-70">
                                Remaining
                            </p>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                            {orderList.map((item) => (
                                <tr
                                    key={item.product}
                                    className={`border border-gray-300 p-2 ${
                                        item.remaining === 0
                                          ? 'bg-green-400'
                                          : item.remaining < 0
                                          ? 'bg-red-400'
                                          : ''
                                      }`}
                                >
                                    <td className="p-4"><p className="block font-sans text-sm antialiased font-normal leading-normal">{item.product}</p></td>
                                    <td className="p-4"><p className="block font-sans text-sm antialiased font-normal leading-normal">{item.quantity}</p></td>
                                    <td className="p-4"><p className="block font-sans text-sm antialiased font-normal leading-normal">{item.remaining}</p></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
export default ItemsInOrder;