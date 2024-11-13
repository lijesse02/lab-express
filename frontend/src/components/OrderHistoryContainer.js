import React, { useState } from 'react';
import NewOrderCard from './NewOrderCard';
import OrderResponseCard from './OrderResponseCard';
import AddConfig from './AddConfig';
import ExampleDisplay from './ExampleDisplay';

const OrderHistoryContainer = () => {
    const [orderHistory, setOrderHistory] = useState([])
    const handleNewOrder = (orderData) => {
        setOrderHistory([orderData, ...orderHistory])
    };
    return (
        <div style={styles.container}>
            <div style={styles.history}>
                {orderHistory.map((order, index) => (
                    <div key={index}>
                        <OrderResponseCard key={index} order={order} />
                        {/*Barcode Data: {order.barcodes[0].data}*/}
                        {/*Size Count: {order.barcodes[0].size_count}*/}
                    </div>
                ))}
            </div>
            <NewOrderCard onSubmitOrder={handleNewOrder} />
            <AddConfig />
            <ExampleDisplay />

        </div>
    );
};

const styles = {
    container: { maxWidth: '600px', margin: '0 auto', padding: '20px' },
    history: { display: 'flex', flexDirection: 'column-reverse', overflowY: 'auto', maxHeight: '70vh' }
};

export default OrderHistoryContainer;