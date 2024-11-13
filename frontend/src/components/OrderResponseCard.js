import React from "react";

const SIZE_LABELS = {
    0: "nf",
    1: "nfp",
    2: "wf",
    3: "wfp",
    4: "bt",
    5: "btp"
};

const OrderResponseCard = ({ order }) => {

    // Get Order Items
    const hasOrder = order?.barcodes?.[0]?.order;

    // Get Size Count
    const rawSizeCount = order?.barcodes?.[0]?.size_count.slice(1);
    const sizeCount = rawSizeCount && rawSizeCount.length === 12
        ? Array.from({ length: 6 }, (_, i) => rawSizeCount.slice(i * 2, i * 2 + 2))
        : null;

    // Get boxes array
    const boxes = order?.barcodes?.[0]?.boxes?.flat() || [];
    return (
        <div className="max-w-2xl mx-auto mt-4 p-4 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Response</h2>

            {/* Order Items Card */}
            <div className="p-4 bg-gray-100 rounded-lg shadow-sm border border-gray-300">
                <h3 className="text-lg font-bold text-gray-700">Order Items</h3>
                {hasOrder ? (
                    <div>
                        <p className="text-green-700">Items are present in this order.</p>
                        <div className="mt-2 space-y-1">
                            {Object.entries(hasOrder).map(([itemName, quantity], index) => (
                                <p key={index} className="text-gray-800 text-center">
                                    {itemName}: {quantity}
                                </p>
                            ))}
                        </div>
                    </div>

                ) : (
                    <p className="text-red-500">No items in this order.</p>
                )}
            </div>

            {/* Size Count Card */}
            {sizeCount && sizeCount.length === 6 && (
                <div className="p-4 bg-blue-100 rounded-lg shadow-sm border border-blue-300">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Size Count</h3>
                    <div className="flex justify-between">
                        {sizeCount.map((count, index) => (
                            <div key={index} className="text-center">
                                <span className="block text-sm font-medium text-gray-600">{SIZE_LABELS[index]}</span>
                                <span className="block text-xl font-semibold text-gray-800">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

           {/* Boxes Section */}
           {boxes.length > 0 && (
                <div className="p-3 bg-yellow-100 rounded-lg shadow-sm border border-yellow-300">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Boxes</h3>
                    <div className="flex flex-wrap gap-2 justify-between">
                        {boxes.map((item, index) => (
                            <div key={index} className="flex-1 px-2 py-1 bg-white rounded-md shadow-md border-2 border-gray-400 text-gray-800 text-sm text-center">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>



    )
};

export default OrderResponseCard;