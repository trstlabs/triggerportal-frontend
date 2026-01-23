import React, { useState, useEffect } from 'react';
import { styled } from 'components/ui-blocks'


const StyledPNGBottom = styled('img', {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '350px',
    zIndex: '$1',
    userSelect: 'none',
    userDrag: 'none',
    // opacity: '90%',
    filter: 'sepia(31%) contrast(120%) saturate(89%)'
})


const images = {
    backgrounds: [
        '/img/portal.png',
        '/img/portal3.png',
        '/img/portal4.png',
        '/img/portal3.png',
        // Add more backgrounds here
    ],
    objects: [
        '/img/Designer.png',
        '/img/dogestronaut.png',
        '/img/cosmonaut.png',
        // Add more objects here
    ],
};

const ImageRotator = () => {
    const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(2);
    const [currentObjectIndex, setCurrentObjectIndex] = useState(2);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBackgroundIndex((prevIndex) =>
                (prevIndex + 1) % images.backgrounds.length
            );
            setCurrentObjectIndex((prevIndex) =>
                (prevIndex + 1) % images.objects.length
            );
        }, 300000); // Change images every 300 seconds


        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <StyledPNGBottom src={images.backgrounds[currentBackgroundIndex]} alt="Background" />
            <StyledPNGBottom src={images.objects[currentObjectIndex]} alt="Object" />
        </div>
    );
};

export default ImageRotator;
