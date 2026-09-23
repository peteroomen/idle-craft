import React from 'react';
import { Silkscreen } from 'next/font/google'

const sfc = Silkscreen({
    subsets: ['latin'],
    display: 'swap',
    weight: "700",
});

export default function Title() {
    return <h3 className={`${sfc.className} text-4xl text-white mb-1`}>nextidle</h3>;
}