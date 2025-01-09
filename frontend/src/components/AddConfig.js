import React, { useState } from 'react';

const AddConfig = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [sizeCount, setSizeCount] = useState('');
    const [boxes, setBoxes] = useState(['', '', '', '', '', '']);

    // Toggle the popup
    const togglePopup = () => setShowPopup(!showPopup);

    // Handle individual box input updates
    const handleBoxChange = (index, value) => {
        const updatedBoxes = [...boxes];
        updatedBoxes[index] = value;
        setBoxes(updatedBoxes);
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const configData = {
            size_count: sizeCount,
            boxes: boxes.filter(box => box.trim() !== ''), // Only include filled boxes
        };

        try {
            const response = await fetch('http://localhost:5000/api/add-configuration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configData),
            });

            if (response.ok) {
                console.log('Configuration submitted successfully');
                setShowPopup(false);
                setSizeCount('');
                setBoxes(['', '', '', '', '', '']); // Reset form fields
            } else {
                console.error('Failed to submit configuration');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div>
            {/* Button to open the popup */}
            <button
                onClick={togglePopup}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
            >
                Add Configuration
            </button>

            {/* Popup Form */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Set New Configuration</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Size Count</label>
                                <input
                                    type="text"
                                    value={sizeCount}
                                    onChange={(e) => setSizeCount(e.target.value)}
                                    placeholder="Enter size count"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-1">Boxes</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            value={boxes[index]}
                                            onChange={(e) => handleBoxChange(index, e.target.value)}
                                            placeholder={`Box ${index + 1}`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={togglePopup}
                                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddConfig;
