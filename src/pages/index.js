"use client";
import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import axios from 'axios';
import Image from 'next/image';
import domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';
import { Rnd } from 'react-rnd';
import toast from 'react-hot-toast';

const DraggableResizableBox = ({ content, style }) => {
  return (
    <Rnd
      default={{
        x: 60,
        y: 50,
        width: 300,
        height: 60,
      }}
      bounds="parent"
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
      }}
    >
      <div style={style}>
        {content}
      </div>
    </Rnd>
  );
};

const Popup = () => {
  const [heading, setHeading] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [image, setImage] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [onDay, setOnDay] = useState('sunday');
  const [timeFrequency, setTimeFrequency] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [onlyImage, setOnlyImage] = useState(false);

  //Popup
  const [showPopupForm, setShowPopupForm] = useState(true);
  const [activePopups, setActivePopups] = useState([]);
  const [recentPopups, setRecentPopups] = useState([]);

  const [loading, setLoading] = useState(false);

  // New state for additional configurations
  const [imagePosition, setImagePosition] = useState('left');
  const [textAlignment, setTextAlignment] = useState('center');
  const [bgColor, setBgColor] = useState('#e1ded5');
  const [headingColor, setHeadingColor] = useState('#000000');
  const [bodyColor, setBodyColor] = useState('#000000');
  const [footerColor, setFooterColor] = useState('#000000');
  const [isHovered, setIsHovered] = useState(false);

  const previewRef = useRef(null);

  const alignmentOptions = ['center', 'left', 'right'];
  const imageAlignmentOptions = ['left', 'right', 'top', 'bottom'];

  const toggleAlignment = () => {
    const currentIndex = alignmentOptions.indexOf(textAlignment);
    const nextIndex = (currentIndex + 1) % alignmentOptions.length;
    setTextAlignment(alignmentOptions[nextIndex]);
  };

  const toggleImageAlignment = () => {
    const currentIndex = imageAlignmentOptions.indexOf(imagePosition);
    const nextIndex = (currentIndex + 1) % imageAlignmentOptions.length;
    setImagePosition(imageAlignmentOptions[nextIndex]);
  };

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const convertBlobToBase64 = (blob) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    try {
      setLoading(true);

      const scale = 4;
      const previewElement = previewRef.current;

      if (previewElement) {
        const style = {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${previewElement.offsetWidth}px`,
          height: `${previewElement.offsetHeight}px`,
        };

        const blob = await domtoimage.toBlob(previewElement, {
          width: previewElement.offsetWidth * scale,
          height: previewElement.offsetHeight * scale,
          style,
        });

        const base64Image = await convertBlobToBase64(blob);

        const response = await axios.post('/api/popup', {
          heading,
          bodyText,
          footerText,
          frequency,
          timeFrequency,
          popup: String(true),
          delete: String(false),
          onDay,
          previewImage: base64Image,
        });

        if (response.status === 200) {
          notifySuccess(response.data.message)
          setShowPopupForm(false);
          setActivePopups(prevActivePopups => [...prevActivePopups, response.data.data]);
        }
        setLoading(false);
      } else {
        console.error('Preview element is null');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error.response.data.message);
      notifyError(error.response.data.message);
      setShowPopupForm(false)
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setImage('');
    setOnlyImage(false)
  }

  const downloadImage = () => {
    const scale = 4;
    const previewElement = previewRef.current;

    if (previewElement) {
      const style = {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${previewElement.offsetWidth}px`,
        height: `${previewElement.offsetHeight}px`,
      };

      domtoimage.toBlob(previewElement, { width: previewElement.offsetWidth * scale, height: previewElement.offsetHeight * scale, style })
        .then(blob => {
          saveAs(blob, 'preview.png');
        })
        .catch(error => {
          console.error('Error capturing the image:', error);
        });
    } else {
      console.error('Preview element is null');
    }
  };

  const handleToggle = async (popup) => {
    const updatedPopup = { ...popup, isActive: !popup.isActive };

    try {
      // Send update to backend
      const response = await axios.put('/api/popup', {
        uuid: popup.uuid,
        popup: updatedPopup.isActive
      });

      notifySuccess(response.data.message)

      if (updatedPopup.isActive) {
        // Move popup to active popups
        setRecentPopups(recentPopups.filter(p => p.id !== popup.id));
        setActivePopups([...activePopups, updatedPopup]);
      } else {
        // Move popup to recent popups
        setActivePopups(activePopups.filter(p => p.id !== popup.id));
        setRecentPopups([...recentPopups, updatedPopup]);
      }
    } catch (error) {
      console.error('Error updating popup:', error);
    }
  };

  const handleDelete = async (popup) => {
    try {
      const response = await axios.delete('/api/popup', { data: { uuid: popup.uuid } });
      notifySuccess(response.data.message)
      setActivePopups(activePopups.filter(p => p.uuid !== popup.uuid));
      setRecentPopups(recentPopups.filter(p => p.uuid !== popup.uuid));
    } catch (error) {
      console.error('Error deleting popup:', error);
    }
  };

  useEffect(() => {
    const fetchPopups = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/popup');
        // console.log("Use Effect", response.data);
        const fetchedPopups = response.data;
        setActivePopups(fetchedPopups.filter((popup) => popup.isActive));
        setRecentPopups(fetchedPopups.filter((popup) => !popup.isActive));
        setShowPopupForm(fetchedPopups.length === 0);
      } catch (error) {
        console.error('Error fetching popups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopups();
  }, []);

  if (isLoading) {
    return (
      <div className='h-full w-full flex justify-center items-center'>
        <div className="spinner">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  const notifyError = (message) => {
    toast.error(message)
  }

  const notifySuccess = (message) => {
    toast.success(message)
  }

  return (
    <div className="flex w-full h-screen p-4">

      {/* Form Section */}
      {showPopupForm && (
        <div className="relative flex-1 w-1/3 h-full pb-4 px-4 bg-gray-500 text-black border border-gray-500 rounded-lg shadow-lg">
          <h2 className="text-xl text-gray-200 pt-2 text-center font-bold mb-4">Configure Popup</h2>
          {/* Heading  */}
          <label className="block mb-4 mt-4">
            <input
              type="text"
              value={heading}
              placeholder="Heading"
              onChange={(e) => setHeading(e.target.value)}
              className="bg-[#222630] px-4 py-1.5 outline-none w-full text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040]"
            />
          </label>

          {/* Body  */}
          <label className="block mb-2">
            <textarea
              placeholder='Body'
              rows={2}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="bg-[#222630] px-4 py-1.5 outline-none w-full text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040]"
            />
          </label>

          {/* Footer  */}
          <label className="block mb-4">
            <input
              type="text"
              value={footerText}
              placeholder="Footer"
              onChange={(e) => setFooterText(e.target.value)}
              className="bg-[#222630] px-4 py-1.5 outline-none w-full text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040]"
            />
          </label>

          {/* Upload File  */}
          <div>
            <div className='flex flex-row space-x-4 items-center'>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={`block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#222630] file:text-gray-300 hover:file:bg-gray-700 file:cursor-pointer`}
              />
              {image && (
                <div className='flex items-center justify-center pt-1'>
                  <button
                    className="text-black text-sm font-thin"
                    onClick={handleRemove}
                  >
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="peer ring-0 bg-rose-500  rounded-full outline-none duration-300 after:duration-500 w-7 h-7 pr-1  shadow-md peer-checked:bg-emerald-500  peer-focus:outline-none  after:content-['✖️'] after:rounded-full after:absolute after:outline-none after:h-5 after:w-5 after:bg-gray-50 after:top-1 after:left-1 after:flex after:justify-center after:items-center  peer-hover:after:scale-75 peer-checked:after:content-['✔️'] after:-rotate-180 peer-checked:after:rotate-0">
                      </div>
                    </label>
                  </button>
                </div>
              )}

              {/* Toggle Switch */}
              <div className="flex flex-row justify-center items-center w-60 space-x-2">
                <div className='flex items-center justify-center'>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={onlyImage}
                      onChange={() => { setOnlyImage(!onlyImage) }}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <h3 className='text-black text-sm font-medium'>Image only</h3>
              </div>

            </div>
          </div>

          <label className="block mt-4">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="bg-[#222630] px-2 py-1.5 outline-none w-full text-gray-300 rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040] cursor-pointer"
            >
              <option value="default">Select frequency</option>
              <option value="once">Once</option>
              <option value="onreload">On Reload</option>
              <option value="untilclicked">Until Clicked</option>
              <option value="onday">On Day</option>
              <option value="repeatedly">Repeatedly</option>
            </select>
          </label>

          {frequency === 'repeatedly' && (
            <label className="block mt-4">
              <input
                type="number"
                placeholder='Time in minutes'
                value={timeFrequency}
                onChange={(e) => setTimeFrequency(e.target.value)}
                className="bg-[#222630] px-2 py-1.5 outline-none w-full text-gray-300 rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040] cursor-pointer"
              />
            </label>
          )}

          {frequency === 'onday' && (
            <label className="block mt-4">
              <select
                value={onDay}
                onChange={(e) => setOnDay(e.target.value)}
                className="bg-[#222630] px-2 py-1.5 outline-none w-full text-gray-300 rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040] cursor-pointer"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thrusday">Thrusday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
              </select>
            </label>
          )}

          <div className='absolute inset-x-0 bottom-16 w-full items-center flex flex-row justify-evenly mt-8'>

            <button
              onClick={() => { setShowPopupForm(false) }}
              className="px-4 py-2 w-32 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 w-32 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed"
            >
              Send
            </button>

          </div>
        </div>
      )}

      {/* Preview Section */}
      {showPopupForm && (
        <div className="w-full h-full ml-4 p-4 bg-gray-600 border border-gray-600 rounded-lg">

          {/* Tools  */}
          <div className='w-full flex justify-center items-center mb-4'>
            <div className='flex flex-row justify-evenly items-center w-96 h-12 border-2 my-2 rounded-md'>
              {/* Background Color  */}
              <div
                className='w-10 pb-1 h-8 border-2 flex items-center justify-center rounded-md cursor-pointer'
                type='color'
                style={{ backgroundColor: bgColor }}
                onClick={() => document.getElementById('bgColor').click()}
              >
                <h2 className={`font-bold text-xl underline underline-offset-2 text-white w-full text-center`}>B</h2>
              </div>
              <input
                id="bgColor"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="hidden"
              />
              {/* Heading  */}
              <div
                className='w-10 h-8 pb-1 border-2 flex items-center justify-center rounded-md cursor-pointer'
                type='color'
                style={{ backgroundColor: headingColor }}
                onClick={() => document.getElementById('headingColor').click()}
              >
                <h2 className={`font-bold text-xl underline underline-offset-2 text-${headingColor}`}>H</h2>
              </div>
              <input
                id="headingColor"
                type="color"
                value={headingColor}
                onChange={(e) => setHeadingColor(e.target.value)}
                className="hidden"
              />
              {/* Body  */}
              <div
                className='w-10 h-8 pb-1 border-2 flex items-center justify-center rounded-md  cursor-pointer'
                type='color'
                style={{ backgroundColor: bodyColor }}
                onClick={() => document.getElementById('bodyColor').click()}
              >
                <h2 className={`font-bold text-xl underline underline-offset-2 text-${bodyColor}`}>P</h2>
              </div>
              <input
                id="bodyColor"
                type="color"
                value={bodyColor}
                onChange={(e) => setBodyColor(e.target.value)}
                className="hidden"
              />
              {/* Footer  */}
              <div
                className='w-10 h-8 pb-1 border-2 flex items-center justify-center rounded-md cursor-pointer'
                type='color'
                style={{ backgroundColor: footerColor }}
                onClick={() => document.getElementById('footerColor').click()}
              >
                <h2 className={`font-bold text-xl underline underline-offset-2 text-${footerColor}`}>F</h2>
              </div>
              <input
                id="footerColor"
                type="color"
                value={footerColor}
                onChange={(e) => setFooterColor(e.target.value)}
                className="hidden"
              />
              {/* Text Alignment  */}
              <div
                className='w-10 h-8 border-2 flex items-center justify-center rounded-md cursor-pointer'
                onClick={toggleAlignment}
              >
                <div className={`font-bold text-xl underline underline-offset-2 text-white`}>
                  {textAlignment === 'left' &&
                    <svg width="73px" height="73px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='w-6 h-6'>
                      <path d="M3 10H16M3 14H21M3 18H16M3 6H21" stroke="#ffffff" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  }
                  {textAlignment === 'center' &&
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='w-6 h-6'>
                      <path
                        d="M3 6H21M3 14H21M17 10H7M17 18H7"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  {textAlignment === 'right' &&
                    <svg width="72px" height="72px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='w-6 h-6'>
                      <path d="M8 10H21M3 14H21M8 18H21M3 6H21" stroke="#ffffff" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  }
                </div>
              </div>
              {/* Image Alignment  */}
              <div
                className='w-10 h-8 border-2 flex items-center justify-center rounded-md cursor-pointer'
                onClick={toggleImageAlignment}
              >
                <div className={`font-bold text-xl underline underline-offset-2 text-white`}>
                  <svg fill="#ffffff" width="73px" height="73px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#fff" strokeWidth="0.00020" className='w-6 h-6 fill-white'>
                    <path d="M0 26.016q0 2.496 1.76 4.224t4.256 1.76h20q2.464 0 4.224-1.76t1.76-4.224v-20q0-2.496-1.76-4.256t-4.224-1.76h-20q-2.496 0-4.256 1.76t-1.76 4.256v20zM4 26.016v-20q0-0.832 0.576-1.408t1.44-0.608h20q0.8 0 1.408 0.608t0.576 1.408v20q0 0.832-0.576 1.408t-1.408 0.576h-20q-0.832 0-1.44-0.576t-0.576-1.408zM6.016 24q0 0.832 0.576 1.44t1.408 0.576h16q0.832 0 1.408-0.576t0.608-1.44v-0.928q-0.224-0.448-1.12-2.688t-1.6-3.584-1.28-2.112q-0.544-0.576-1.12-0.608t-1.152 0.384-1.152 1.12-1.184 1.568-1.152 1.696-1.152 1.6-1.088 1.184-1.088 0.448q-0.576 0-1.664-1.44-0.16-0.192-0.48-0.608-1.12-1.504-1.6-1.824-0.768-0.512-1.184 0.352-0.224 0.512-0.928 2.24t-1.056 2.56v0.64zM6.016 9.024q0 1.248 0.864 2.112t2.112 0.864 2.144-0.864 0.864-2.112-0.864-2.144-2.144-0.864-2.112 0.864-0.864 2.144z"></path>
                  </svg>
                </div>
              </div>
              {/* Download Button  */}
              <div
                className='w-10 h-8 border-2 flex items-center justify-center rounded-md cursor-pointer'
                onClick={downloadImage}
              >
                <div className={`font-bold text-xl underline underline-offset-2 text-white`}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='w-6 h-6'>
                    <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12ZM12 6.25C12.4142 6.25 12.75 6.58579 12.75 7V12.1893L14.4697 10.4697C14.7626 10.1768 15.2374 10.1768 15.5303 10.4697C15.8232 10.7626 15.8232 11.2374 15.5303 11.5303L12.5303 14.5303C12.3897 14.671 12.1989 14.75 12 14.75C11.8011 14.75 11.6103 14.671 11.4697 14.5303L8.46967 11.5303C8.17678 11.2374 8.17678 10.7626 8.46967 10.4697C8.76256 10.1768 9.23744 10.1768 9.53033 10.4697L11.25 12.1893V7C11.25 6.58579 11.5858 6.25 12 6.25ZM8 16.25C7.58579 16.25 7.25 16.5858 7.25 17C7.25 17.4142 7.58579 17.75 8 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17C16.75 16.5858 16.4142 16.25 16 16.25H8Z" fill="#3bdb39"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h1 className='text-sm text-white/80 text-center pb-2'>Tip: Drag the texts to place them in your preferred position.</h1>

          {/* Popup Preview */}
          <div ref={previewRef} className={`relative rounded-lg overflow-hidden flex justify-center items-center`}>
            {image ?
              (onlyImage
                ?
                (
                  <div className={`relative flex text-${textAlignment} w-[600px] h-[400px] border border-none rounded-lg`} style={{ backgroundColor: bgColor }}>
                    <Image src={image} className='rounded-lg' layout="fill" objectFit="cover" alt="Uploaded" />
                  </div>
                )
                :
                (
                  <div className='flex items-center'>
                    {imagePosition === 'left' && (
                      <div className={`relative flex text-${textAlignment} w-[600px] h-[350px] border border-none rounded-lg`} style={{ backgroundColor: bgColor }}>
                        <div className="relative h-full w-1/2 bg-contain">
                          <Image src={image} className='rounded-lg' layout="fill" objectFit="cover" alt="Uploaded" />
                        </div>
                        <div
                          className="relative w-1/2 h-full flex flex-col items-center px-4"
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                        >

                          <DraggableResizableBox
                            content={heading}
                            style={{
                              fontSize: '22px',
                              fontWeight: 'bold',
                              color: headingColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px'
                            }}
                          />

                          <DraggableResizableBox
                            content={bodyText}
                            style={{
                              fontSize: '16px',
                              fontWeight: 'normal',
                              color: bodyColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px',
                            }}
                          />

                          <DraggableResizableBox
                            content={footerText}
                            style={{
                              fontSize: '12px',
                              fontWeight: 'normal',
                              color: footerColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '1 px',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {imagePosition === 'right' && (
                      <div className="relative flex w-[600px] h-[350px] border border-none  rounded-lg" style={{ backgroundColor: bgColor }}>
                        <div className={`relative w-1/2 text-${textAlignment} h-full flex flex-col items-center justify-center px-4`}
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                        >
                          <DraggableResizableBox
                            content={heading}
                            style={{
                              fontSize: '22px',
                              fontWeight: 'bold',
                              color: headingColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px'
                            }}
                          />

                          <DraggableResizableBox
                            content={bodyText}
                            style={{
                              fontSize: '16px',
                              fontWeight: 'normal',
                              color: bodyColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px',
                            }}
                          />

                          <DraggableResizableBox
                            content={footerText}
                            style={{
                              fontSize: '12px',
                              fontWeight: 'normal',
                              color: footerColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '1 px',
                            }}
                          />
                        </div>
                        <div className="relative h-full w-1/2 bg-contain">
                          <Image src={image} className='rounded-lg' layout="fill" objectFit="cover" alt="Uploaded" />
                        </div>
                      </div>
                    )}

                    {imagePosition === 'top' && (
                      <div className="w-[280px] h-[400px] border border-none flex flex-col items-center justify-center rounded-lg" style={{ backgroundColor: bgColor }}>
                        <div className="h-1/2 w-full relative  bg-cover">
                          <Image src={image} className='rounded-lg' layout="fill" objectFit="cover" alt="Uploaded" />
                        </div>
                        <div className={`h-1/2 w-full text-${textAlignment} flex flex-col items-center justify-center px-4`}
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                        >
                          <DraggableResizableBox
                            content={heading}
                            style={{
                              fontSize: '22px',
                              fontWeight: 'bold',
                              color: headingColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px'
                            }}
                          />

                          <DraggableResizableBox
                            content={bodyText}
                            style={{
                              fontSize: '16px',
                              fontWeight: 'normal',
                              color: bodyColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px',
                            }}
                          />

                          <DraggableResizableBox
                            content={footerText}
                            style={{
                              fontSize: '12px',
                              fontWeight: 'normal',
                              color: footerColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '1 px',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {imagePosition === 'bottom' && (
                      <div className="w-[280px] h-[400px] border border-none flex flex-col rounded-lg" style={{ backgroundColor: bgColor }}>
                        <div className={`h-1/2 w-full text-${textAlignment} flex flex-col items-center justify-center px-4`}
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                        >
                          <DraggableResizableBox
                            content={heading}
                            style={{
                              fontSize: '22px',
                              fontWeight: 'bold',
                              color: headingColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px'
                            }}
                          />

                          <DraggableResizableBox
                            content={bodyText}
                            style={{
                              fontSize: '16px',
                              fontWeight: 'normal',
                              color: bodyColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '4 px',
                            }}
                          />

                          <DraggableResizableBox
                            content={footerText}
                            style={{
                              fontSize: '12px',
                              fontWeight: 'normal',
                              color: footerColor,
                              border: isHovered ? '1px solid #000' : '1px solid transparent',
                              transition: 'border 0.3s',
                              padding: '1 px',
                            }}
                          />
                        </div>
                        <div className="h-1/2 w-full relative  bg-cover">
                          <Image src={image} className='rounded-lg' layout="fill" objectFit="cover" alt="Uploaded" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              )
              :
              <div className='flex justify-center items-center w-96'>
                <div className="relative h-36 w-full rounded-lg border border-none" style={{ backgroundColor: bgColor }}>
                  <div className={`relative h-full text-${textAlignment} flex flex-col items-center justify-center px-4`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <DraggableResizableBox
                      content={heading}
                      style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: headingColor,
                        border: isHovered ? '1px solid #000' : '1px solid transparent',
                        transition: 'border 0.3s',
                        padding: '4 px'
                      }}
                    />

                    <DraggableResizableBox
                      content={bodyText}
                      style={{
                        fontSize: '16px',
                        fontWeight: 'normal',
                        color: bodyColor,
                        border: isHovered ? '1px solid #000' : '1px solid transparent',
                        transition: 'border 0.3s',
                        padding: '4 px',
                      }}
                    />

                    <DraggableResizableBox
                      content={footerText}
                      style={{
                        fontSize: '12px',
                        fontWeight: 'normal',
                        color: footerColor,
                        border: isHovered ? '1px solid #000' : '1px solid transparent',
                        transition: 'border 0.3s',
                        padding: '1 px',
                      }}
                    />
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      )
      }

      {/* Active and Recent Popups  */}
      {!showPopupForm && (
        <div className="flex w-full h-full justify-center items-center p-6 bg-gray-100 rounded-lg shadow-md text-black">
          <div className='flex flex-col justify-center items-center'>
            <div>
              <button
                onClick={() => setShowPopupForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
              >
                Add +
              </button>
            </div>

            <div className='flex flex-col'>
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Active Popups</h3>
                {activePopups.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {activePopups.map(popup => (
                      <li key={popup.id} className="mb-2 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          {popup.previewImage && (
                            <div className='relative h-36 w-80 border-2 border-gray-300 rounded-lg'>
                              <Image
                                src={`data:image/png;base64,${popup.previewImage}`}
                                alt={popup.heading}
                                layout='fill'
                                objectFit='cover'
                                className="rounded"
                              />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggle(popup)}
                          className="px-3 ml-4 py-1 rounded text-white bg-red-500 hover:bg-red-600 w-28"
                        >
                          Deactivate
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No active popups</p>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Recent Popups</h3>
                {recentPopups.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {recentPopups.map(popup => (
                      <li key={popup.id} className="mb-2 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          {popup.previewImage && (
                            <div className='relative h-36 w-80 border-2 border-gray-300 rounded-lg'>
                              <Image
                                src={`data:image/png;base64,${popup.previewImage}`}
                                alt={popup.heading}
                                layout='fill'
                                objectFit='cover'
                                className="rounded"
                              />
                            </div>
                          )}
                        </div>
                        <div className='flex flex-col justify-center items-center space-y-2'>
                          <button
                            onClick={() => handleToggle(popup)}
                            className="px-3 ml-4 py-1 rounded text-white bg-green-500 hover:bg-green-600 w-28"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleDelete(popup)}
                            className="px-3 ml-4 py-1 rounded text-white bg-red-300 hover:bg-red-600 w-28"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent popups</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

export default Popup;