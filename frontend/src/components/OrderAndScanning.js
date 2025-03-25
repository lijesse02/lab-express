import React, { useEffect, useState } from "react";
import boxImage from '../assets/openBox.png'
import ItemsInOrder from './ItemsInOrder'
import Order from "./mainPageComponents/Order";
import Items from "./mainPageComponents/Items";

const OrderAndScanning = () => {
    //To Be Displayed
    const [clientInfo, setClientInfo] = useState({
        name: "",
        shipDate: "",
        shipMethod: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip: "",
    })
    const [order, setOrder] = useState([])
    // order = items in order
    const [scannedItems, setScannedItems] = useState([])
    const [boxes, setBoxes] = useState([])
    const [error, setError] = useState("None")
    const [log, setLog] = useState("")

    //Not Displayed
    const [itemBarcode, setItemBarcode] = useState(0)
    const [orderBarcode, setOrderBarcode] = useState("")

    const handleOrderBarcodeUpdate = (newBarcode) => {
        setOrderBarcode(newBarcode)
    }

    const handleClear = () => {
        setScannedItems([])
        setBoxes([])
        setOrder([])
        setOrderBarcode("")
        setClientInfo({
            name: "",
            shipDate: "",
            shipMethod: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            zip: "",
        })
    }

    const handleLog = async (e) => {
        try{
            const response = await fetch("http://localhost:5000/api/log", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    message: "Order " + orderBarcode + " Completed"
                })
            })

            if (response.ok){
                const data = await response.json()
                console.log(data)
            }
        }catch{
            console.error("bad new item barcode submission", 407)
        }
    }

    const addOrUpdateItem = (itemName, itemSize, itemQuantity=1, itemUM) => {
        setScannedItems((prevList) => {
            const existingItem = prevList.find((item) => item.item_name === itemName)

            if (existingItem){
                return prevList.map((item) => 
                    item.item_name === itemName 
                    ? {...item, item_quantity:item.item_quantity + Number(itemQuantity)}
                    : item
                )
            }

            const newItem = {
                item_name: itemName,
                item_size: itemSize,
                item_quantity: Number(itemQuantity),
                item_um: itemUM
            }

            return [...prevList, newItem]
        })
        
        
        console.log(order)
    }

    useEffect(() => {
        setOrder((prevList) => {
            const updatedList = [...prevList]

            scannedItems.forEach((scannedItem) => {
                const existingItem = updatedList.find((item) => item.product.startsWith(scannedItem.item_name))

                if(existingItem){
                    if(existingItem.remaining <= 0){
                        if(existingItem.quantity - scannedItem.item_quantity >= 0){
                            existingItem.remaining = existingItem.quantity - scannedItem.item_quantity
                        }else{
                            existingItem.remaining = -1
                        }
                    }
                    else if (existingItem.remaining > 0 && existingItem.quantity - scannedItem.item_quantity < 0){
                        existingItem.remaining = 0
                    }else{
                        existingItem.remaining = existingItem.quantity - scannedItem.item_quantity
                    }
                }else{
                    updatedList.push({
                        product: scannedItem.item_name,
                        quantity: 0,
                        remaining: -1
                    })
                }
            })

            return updatedList
        })
    }, [scannedItems])

    const handleBoxesUpdate = (newBoxes) => {
        setBoxes(newBoxes)
    }

    const handleOrderUpdate = (newOrder) => {
        setOrder(newOrder)
    }

    const handleClientUpdate = (newClient) => {
        setClientInfo(newClient)
    }

    return (
        <div className="h-screen flex flex-col">

            {/* Order and Items Div */}
            <div className="h-[60%] w-full flex">
                {/* Order */}
                <div className="w-3/5 bg-gray-100 flex flex-col border-4 border-emerald-300 rounded-md shadow-md">
                    <div className="flex h-1/4">
                            <button
                            onClick={handleClear}
                            className="block m-2 w-1/2 px-4 py-2 bg-red-300 text-white rounded hover:bg-red-500"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleLog}
                            className="block m-2 w-1/2 px-4 py-2 bg-emerald-300 text-white rounded hover:bg-green-500"
                        >
                            Log
                        </button>
                    </div>
                    <Order order={order} updateOrder={handleOrderUpdate} updateBoxes={handleBoxesUpdate} updateOrderBarcode={handleOrderBarcodeUpdate} updateClient={handleClientUpdate} />
                </div>
                {/* Items */}
                <div className="w-2/5 flex border-4 border-blue-300 justify-center rounded-md shadow-md">
                    <Items order={order} items={scannedItems} updateItems={addOrUpdateItem}/>
                </div>
            </div>
            
            {/* Boxes */}
            <div className="h-[40%] w-full bg-gray-100 flex items-center rounded-md shadow-md border-4 border-red-400">
                <div className="w-1/4 flex flex-col space-y-2">
                    <p><strong>Order Number:</strong> {orderBarcode}</p>
                    <p><strong>Name:</strong> {clientInfo.name}</p>
                    <p><strong>Date:</strong> {clientInfo.shipDate}</p>
                    <p><strong>Via:</strong> {clientInfo.shipMethod}</p>
                    <p><strong>Address1:</strong> {clientInfo.address1}</p>
                    <p><strong>Address2:</strong> {clientInfo.address2}</p>
                    <p><strong>City:</strong> {clientInfo.city}</p>
                    <p><strong>State:</strong> {clientInfo.state}</p>
                    <p><strong>Zip Code:</strong> {clientInfo.zip}</p>
                </div>
                <div className="items-center justify-center">
                    {boxes.map((box) => (
                        <div
                            key={box.id}
                            className="border-2 border-red-400 p-8 mx-6 rounded-lg my-auto shadow-lg"
                        >
                            <h2 className="text-lg font-semibold">{box.size}</h2>
                            <p className="text-gray-600">Contains: {box.items}</p>
                            <input
                                    type="text"
                                    value={box.weight}
                                    onChange={(e) => box.weight = e.target.value}
                                    placeholder="Enter weight"
                                    className="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
                                />
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )



}

export default OrderAndScanning;