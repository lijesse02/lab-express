import React, { useEffect, useState } from 'react';
import '../tailwind.css'

const NewOrderCard = ({ onSubmitOrder }) => {
    const [inputFile, setInputFile] = useState(null);
    const [ordersFile, setOrdersFile] = useState(null);
    const [error, setError] = useState('');
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
            setOrdersFile(selectedFile);
            setError('')
            /*
            *** useEffect(() => {
            ***     console.log("Successful Select File")
            *** }, [])
            */
        }else{
            setOrdersFile(null)
            setError('Please select a valid File')
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if(!ordersFile) {
            setError('Please upload excel file')
            return;
        }
        const formData = new FormData();
        formData.append('file', ordersFile);

        try{
            const response = await fetch('https://www.jesse-li.dev/backend/api/decode-excel', {
                method: 'POST',
                body: formData
            });
            const orderData = await response.json();
            if (response.ok) {
                console.log(orderData)
            }else{
                setError(orderData.error || 'Failed to decode barcode')
                console.log(orderData)
            }
        }catch (err){
            setError('Error connecting to backend')
        }
    };

    const handleInputChange = (e) => {
        const selectedInputFile = e.target.files[0];
        if (selectedInputFile && selectedInputFile.name.endsWith(".xlsx")){
            setInputFile(selectedInputFile);
            setError("")
        }else{
            setInputFile(null)
            setError("Please select a valid input file")
        }
    };
    const handleInputSubmit = async (e) => {
        e.preventDefault();
        if(!inputFile) {
            setError('Please upload excel file')
            return;
        }
        const inputFormData = new FormData();
        inputFormData.append('file', inputFile);

        try{
            const response = await fetch('https://www.jesse-li.dev/backend/api/input-excel', {
                method: 'POST',
                body: inputFormData
            });
            const inputResponse = await response.json();
            if (response.ok) {
                console.log(inputResponse)
            }else{
                setError(inputResponse.error || 'Failed to decode barcode')
                console.log(inputResponse)
            }
        }catch (err){
            setError('Error connecting to backend')
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">New Order Sheet</h2>
            <form onSubmit={handleSubmit} className="flex items-center space-x-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Upload an Excel File From QuickBooks</h3>
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
                <button
                    onClick={() => window.open('https://www.jesse-li.dev/backend/api/return-excel', '_blank')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Download Excel
                </button>
            </form>

            <form onSubmit={handleInputSubmit} className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-700">Submit a completed Excel File with Input</h3>
                <input
                    type="file"
                    onChange={handleInputChange}
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