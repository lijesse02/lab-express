import React, { useState } from "react";
import OrderHistoryContainer from './components/OrderHistoryContainer';
import CurrentPackingOrder from './components/CurrentPackingOrder';
import OrderAndScanning from "./components/OrderAndScanning";

const App = () => {
    const [currentTab, setCurrentTab] = useState("currentPackingOrder")
    const [index, setIndex] = useState(1)
    return (
            <div className="min-h-screen bg-gray-100 p-4">
            <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
                {/* Tab Buttons */}
                <ul className="flex flex-wrap -mb-px">
                    <button
                        onClick={() => setCurrentTab('currentPackingOrder')}
                        className={`inline-block p-4 border-b-2 rounded-t-lg ${
                            currentTab === 'currentPackingOrder'
                                ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                                : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                        }`}
                    >
                        Packing Order
                    </button>
                    <button
                        onClick={() => setCurrentTab('database')}
                        className={`inline-block p-4 border-b-2 rounded-t-lg ${
                            currentTab === 'database'
                                ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                                : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                        }`}
                    >
                        Database
                    </button>
                </ul>
            </div>

            {/* Tab Content */}
            <div className="bg-white p-4 rounded-md shadow-md">
                {currentTab === 'database' && <OrderHistoryContainer />}
                {currentTab === 'currentPackingOrder' && <OrderAndScanning key={index}/>}
            </div>
        </div>
    );
};



export default App;