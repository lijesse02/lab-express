import React, { useEffect, useState } from 'react';
import '../tailwind.css'

const NewOrderCard = ({ onSubmitOrder }) => {
    const [numberInput, setNumberInput] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setError('')
            /*
            *** useEffect(() => {
            ***     console.log("Successful Select File")
            *** }, [])
            */
        }else{
            setFile(null)
            setError('Please select a valid Image')
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if(!file) {
            setError('Please upload image')
            return;
        }
        const formData = new FormData();
        formData.append('image', file);

        try{
            const response = await fetch('http://172.31.24.195:5000/api/decode', {
                method: 'POST',
                body: formData
            });
            const orderData = await response.json();
            if (response.ok) {
                onSubmitOrder(orderData)
            }else{
                setError(orderData.error || 'Failed to decode barcode')
            }
        }catch (err){
            setError('Error connecting to backend')
        }
    };

    const handleInputChange = (e) => setNumberInput(e.target.value);
    const handleInputSubmit = async (e) => {
        e.preventDefault();
        const data = { input_string: numberInput };

        try{
            const response = await fetch('http://172.31.24.195:5000/api/decode-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',  // Ensure Content-Type is set to JSON
                },
                body: JSON.stringify(data)
            });
            const orderData = await response.json();
            if (response.ok) {
                onSubmitOrder(orderData)
            }else{
                setError(orderData.error || 'Faulty code')
            }
        }catch (err){
            setError('Error connecting to backend')
        }
        setNumberInput('');
    };

    return (
        <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">New Order</h2>
            <form onSubmit={handleSubmit} className="flex items-center space-x-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Upload a File</h3>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-49 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 transition duration-200"
                >
                    Upload
                </button>
            </form>

            <form onSubmit={handleInputSubmit} className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-700">Enter a String</h3>
                <input
                    type="text"
                    value={numberInput}
                    onChange={handleInputChange}
                    placeholder="Enter a string"
                    className="w-48 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 transition duration-200"
                >
                    Submit
                </button>
            </form>
        </div>
    );
};

const styles = {
    card: {
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
    },
    error: { color: 'red', marginTop: '10px' },
    submitButton: { marginTop: '10px', padding: '10px 15px', cursor: 'pointer' },
};

export default NewOrderCard;