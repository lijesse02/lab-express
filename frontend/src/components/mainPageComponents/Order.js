import React, { useEffect, useState } from "react";

const Order = ( { order, updateOrder, updateBoxes, updateOrderBarcode } ) => {

    const [orderBarcode, setOrderBarcode] = useState("")

    useEffect(() => {}, [order])

    console.log("Child rendering with:", order)

    const handleOrderSubmit = async (event) => {
        if (event.key === "Enter"){
            try{
                const response = await fetch('http://localhost:5000/api/get-order-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',  // Ensure Content-Type is set to JSON
                    },
                    body: JSON.stringify({ barcode: orderBarcode })
                })

                if (response.ok) {
                    const data = await response.json()
                    /*if (data.status === "Success"){
                        updateParentBoxesList(data.boxes)
                    }*/
                    console.log(data)
                    const items = data.items.map((item) => ({
                        product: item.name,
                        quantity: item.quantity,
                        remaining: item.quantity
                    }))
                    const boxes = data.boxes.map((box) => ({
                        size: box.box,
                        items: box.items,
                        weight: 0
                    }))
                    updateOrder(items)
                    updateBoxes(boxes)
                    updateOrderBarcode(orderBarcode)
                    setOrderBarcode("")
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
            {order.length === 0 ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Order Barcode</label>
                    <input
                        id="order-barcode"
                        type="text"
                        value={orderBarcode}
                        onChange={(e) => setOrderBarcode(e.target.value)}
                        onKeyDown={handleOrderSubmit}
                        placeholder="Enter Order Barcode"
                        className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"

                    />
                </div>
            
            ) : (
            <div>
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
                            {order.map((item) => (
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
            </div>) }
        </div>
    ) 
}

export default Order;