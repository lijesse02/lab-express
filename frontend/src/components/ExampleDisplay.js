import React from 'react';

const ExampleDisplay = () => {
    const colors = [
        'text-rose-700',
        'text-rose-500',
        'text-emerald-700',
        'text-emerald-500',
        'text-blue-700',
        'text-blue-500',
    ];
    
    const exampleStrings = ["xabcdef", "xaabbccddeeff"];

    return (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg shadow-lg flex justify-center items-start space-x-6">

            {/* Example Strings */}
            <div className="text-left">
                <h2 className="text-lg font-bold text-gray-700 mb-4">Example</h2>
                {exampleStrings.map((str, strIndex) => (
                    <p key={strIndex} className="text-xl font-mono text-gray-800">
                        {Array.from(str).map((char, index) => (
                            <span
                                key={index}
                                className={
                                    index > 0 
                                        ? strIndex === 0 // First example
                                            ? colors[(index - 1) % colors.length]
                                            : colors[Math.floor((index - 1) / 2) % colors.length] // Second example
                                        : ''
                                }
                            >
                                {char}
                            </span>
                        ))}
                    </p>
                ))}
            </div>

            {/* Legend as a Card */}
            <div className="max-w-xs bg-white rounded-md shadow-md border border-gray-300 p-2">
                <ul className="space-y-1 text-xs text-left">
                    {['a - narrow', 'b - narrow plugged', 'c - wide', 'd - wide plugged', 'e - bottle tray', 'f - bottle tray plugged'].map((item, index) => (
                        <li key={index} className={colors[index % colors.length]}>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ExampleDisplay;