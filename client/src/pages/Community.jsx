import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Community = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { axios } = useAppContext()

  // Optimized ImageKit URL with transformations for better performance
  const getOptimizedImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    
    if (imageUrl.includes('imagekit.io')) {
      const url = new URL(imageUrl)
      url.searchParams.set('tr', 'w-400,h-300,c-at_max,q-80,f-auto')
      return url.toString()
    }
    
    return imageUrl
  }

  const fetchImages = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data } = await axios.get('/api/user/published-images')
      
      if (data.success) {
        const imageArray = data.images.map(item => ({
          id: item.id || item._id,
          imageUrl: item.content || item.imageUrl,
          userName: item.userName
        }))
        setImages(imageArray)
      } else {
        toast.error(data.message || 'Failed to fetch images')
        setError(data.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong'
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  if (loading) {
    return (
      <div className='p-6 pt-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll'>
        <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-purple-100'>Community Images</h2>
        <div className='flex justify-center items-center py-20'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600'></div>
          <p className='ml-3 text-gray-600 dark:text-purple-200'>Loading images...</p>
        </div>
      </div>
    )
  }

  if (error && images.length === 0) {
    return (
      <div className='p-6 pt-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll'>
        <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-purple-100'>Community Images</h2>
        <div className='text-center py-20'>
          <p className='text-red-500 mb-4'>Error: {error}</p>
          <button 
            onClick={fetchImages}
            className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 pt-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll'>
      <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-purple-100'>Community Images</h2>

      {images.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'>
          {images.map((item, index) => (
            <div 
              key={item.id || item._id || `image-${index}`} 
              className='relative group block rounded-lg overflow-hidden border border-gray-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer'
              onClick={() => window.open(item.imageUrl, '_blank')}
            >
              <img 
                src={getOptimizedImageUrl(item.imageUrl)} 
                alt={`Created by ${item.userName || 'Unknown user'}`} 
                className='w-full h-40 md:h-48 2xl:h-56 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out'
                crossOrigin="anonymous"
                loading="lazy"
                onError={(e) => {
                  if (e.target.src !== item.imageUrl) {
                    e.target.src = item.imageUrl
                  } else {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }
                }}
                onLoad={(e) => {
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'none'
                  }
                }}
              />
              
              <div 
                className='w-full h-40 md:h-48 2xl:h-56 bg-gray-200 dark:bg-gray-700 hidden items-center justify-center text-gray-500 dark:text-gray-400'
                style={{ display: 'none' }}
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div className='absolute bottom-0 right-0 text-xs bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                Created by {item.userName || 'Unknown'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-20'>
          <p className='text-gray-600 dark:text-purple-200 text-lg mb-4'>No images available</p>
          <p className='text-gray-500 dark:text-purple-300 text-sm mb-4'>
            Be the first to share your creation with the community!
          </p>
          <button 
            onClick={fetchImages}
            className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}

export default Community