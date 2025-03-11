import React, { useEffect, useState } from "react";
import boxImage from '../assets/openBox.png'
import ItemsInOrder from './ItemsInOrder'
import Order from "./mainPageComponents/Order";
import Items from "./mainPageComponents/Items";

const OrderAndScanning = () => {
    //To Be Displayed
    const [order, setOrder] = useState([])
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
                    existingItem.remaining = existingItem.quantity - scannedItem.item_quantity
                }else{
                    updatedList.push({
                        product: scannedItem.item_name,
                        quantity: 0,
                        remaining: 0 - Number(scannedItem.item_quantity)
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

    const handleItemsUpdate = (newItem) => {
        setScannedItems(...scannedItems, newItem)
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
                    <Order order={order} updateOrder={handleOrderUpdate} updateBoxes={handleBoxesUpdate} updateOrderBarcode={handleOrderBarcodeUpdate} />
                </div>
                {/* Items */}
                <div className="w-2/5 bg-gray-100 flex border-4 border-blue-300 justify-center rounded-md shadow-md">
                    <Items order={order} items={scannedItems} updateItems={addOrUpdateItem}/>
                </div>
            </div>
            
            {/* Boxes */}
            <div className="h-[40%] w-full bg-gray-100 flex items-center justify-center rounded-md shadow-md border-4 border-red-400">
                {boxes.map((box) => (
                    <div
                        key={box.id}
                        className="border-2 border-red-400 p-8 mx-6 rounded-lg shadow-lg"
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
    )



}

export default OrderAndScanning;