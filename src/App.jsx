import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Copy, Trash2, AlertCircle, CheckCircle, Loader, X, LogOut, User as UserIcon } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';


const App = () => {
  const { user, isLoaded } = useUser();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [pastedResponse, setPastedResponse] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDevModal, setShowDevModal] = useState(false);
  const [showTestData, setShowTestData] = useState(false);
  const [allVideos, setAllVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  
  const sampleVideoData = {
    masterUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    variantUrls: {
      "360p": "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-360p.ism/.m3u8",
      "480p": "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-480p.ism/.m3u8",
      "720p": "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-720p.ism/.m3u8"
    },
    videoId: "sample-test-video-id-12345",
    videoPath: "test_videos/sample-video-path"
  };
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Video.js scripts and styles
  useEffect(() => {
    if (!document.querySelector('link[href*="video-js.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/video.js/8.5.2/video-js.css';
      document.head.appendChild(link);
    }

    if (!window.videojs) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/video.js/8.5.2/video.min.js';
      script.onload = () => {
        console.log('Video.js loaded');
        
        if (!window.videojs?.getPlugin('reloadSourceOnError')) {
          const hlsScript = document.createElement('script');
          hlsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/videojs-contrib-hls/5.15.0/videojs-contrib-hls.min.js';
          hlsScript.onload = () => {
            console.log('Video.js HLS plugin loaded');
          };
          document.head.appendChild(hlsScript);
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // Fetch all videos when user is authenticated
  useEffect(() => {
    if (user) {
      fetchAllVideos();
    }
  }, [user]);

  // Initialize Video.js player
  useEffect(() => {
    if (videoData && videoRef.current && window.videojs) {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      const player = window.videojs(videoRef.current, {
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2]
      });

      playerRef.current = player;

      player.src({
        src: videoData.masterUrl,
        type: 'application/x-mpegURL'
      });

      if (videoData.variantUrls && Object.keys(videoData.variantUrls).length > 0) {
        addQualitySelector(player, videoData);
      }

      player.ready(() => {
        console.log('Video.js player ready');
      });

      return () => {
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }
  }, [videoData]);

  const addQualitySelector = (player, videoData) => {
    const qualityButton = document.createElement('div');
    qualityButton.className = 'vjs-quality-selector';
    const playerEl = player.el();
    const playerWidth = playerEl.offsetWidth;
    const playerHeight = playerEl.offsetHeight;
    
    const dropdownSize = Math.max(12, Math.min(18, playerWidth * 0.015));
    const padding = Math.max(6, Math.min(12, playerWidth * 0.01));
    const borderRadius = Math.max(4, Math.min(8, playerWidth * 0.005));
    
    qualityButton.style.cssText = `
      position: absolute;
      top: ${Math.max(8, playerHeight * 0.02)}px;
      right: ${Math.max(8, playerWidth * 0.015)}px;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.7);
      border-radius: ${borderRadius}px;
      padding: ${padding * 0.8}px;
    `;

    const select = document.createElement('select');
    select.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: ${padding * 0.5}px ${padding}px;
      font-size: ${dropdownSize}px;
      cursor: pointer;
      border-radius: ${borderRadius * 0.8}px;
      min-width: ${Math.max(70, playerWidth * 0.08)}px;
    `;
    
    select.addEventListener('focus', () => {
      const options = select.querySelectorAll('option');
      options.forEach(option => {
        option.style.background = '#333';
        option.style.color = 'white';
      });
    });

    const autoOption = document.createElement('option');
    autoOption.value = videoData.masterUrl;
    autoOption.textContent = 'Auto';
    autoOption.selected = true;
    select.appendChild(autoOption);

    Object.entries(videoData.variantUrls).forEach(([quality, url]) => {
      const option = document.createElement('option');
      option.value = url;
      option.textContent = quality;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const currentTime = player.currentTime();
      const wasPlaying = !player.paused();
      
      player.src({
        src: e.target.value,
        type: 'application/x-mpegURL'
      });

      player.ready(() => {
        player.currentTime(currentTime);
        if (wasPlaying) {
          player.play();
        }
      });
    });

    qualityButton.appendChild(select);
    
    const playerContainer = player.el();
    playerContainer.style.position = 'relative';
    playerContainer.appendChild(qualityButton);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a valid video file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file first');
      return;
    }

    if (!user) {
      setError('Please sign in to upload videos');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('userId', user.id);

    try {
      const response = await fetch('http://localhost:3000/api/v1/videos/hls-upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user.id}` // In real app, use proper JWT token
        }
      });

      const result = await response.json();

      if (result.success) {
        setVideoData(result.data);
        setSuccess('Video uploaded and processed successfully!');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePastedResponse = () => {
    try {
      const parsed = JSON.parse(pastedResponse);
      if (parsed.success && parsed.data) {
        setVideoData(parsed.data);
        setSuccess('Response loaded successfully!');
        setError('');
        setPastedResponse('');
        setShowDevModal(false);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const loadTestData = () => {
    setVideoData(sampleVideoData);
    setSuccess('Test video loaded successfully!');
    setError('');
    setShowTestData(true);
    setShowDevModal(false);
  };

  const clearVideo = () => {
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    setVideoData(null);
    setSuccess('');
    setShowTestData(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('URL copied to clipboard!');
  };

  const fetchAllVideos = async () => {
    setLoadingVideos(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/videos/', {
        headers: {
          'Authorization': `Bearer ${user?.id}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setAllVideos(result.videos);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (err) {
      setError('Error fetching videos: ' + err.message);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    setDeletingVideoId(videoId);
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/api/v1/videos/delete/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${user?.id}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Video deleted successfully!');
        // Remove from local state
        setAllVideos(allVideos.filter(v => v.folder !== videoId));
        
        // If the deleted video is currently playing, clear it
        if (videoData?.videoId === videoId) {
          clearVideo();
        }
      } else {
        setError(result.message || 'Failed to delete video');
      }
    } catch (err) {
      setError('Error deleting video: ' + err.message);
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleViewVideo = (video) => {
    // Find the master playlist URL (usually ends with .m3u8 and contains "master")
    const masterUrl = video.url.find(url => 
      url.includes('.m3u8') && (url.includes('master') || url.includes('playlist'))
    ) || video.url.find(url => url.includes('.m3u8'));

    if (!masterUrl) {
      setError('No valid HLS playlist found for this video');
      return;
    }

    // Extract variant URLs if available
    const variantUrls = {};
    video.url.forEach(url => {
      if (url.includes('360p')) variantUrls['360p'] = url;
      if (url.includes('480p')) variantUrls['480p'] = url;
      if (url.includes('720p')) variantUrls['720p'] = url;
      if (url.includes('1080p')) variantUrls['1080p'] = url;
    });

    setVideoData({
      masterUrl,
      variantUrls,
      videoId: video.folder,
      videoPath: `hls_videos/${video.folder}`
    });

    setShowTestData(false);
    setSuccess('Video loaded successfully!');
    
    // Scroll to player
    setTimeout(() => {
      document.querySelector('.video-js')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            HLS Player
          </h1>
          
          <div>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton />
            </SignedOut>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div className="text-sm">
              <p className="text-green-900 font-medium mb-1">Clerk Authentication Active</p>
            </div>
          </div>
        </div>

        <SignedIn>
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
            
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-1">
                        Choose video file
                      </p>
                      <p className="text-sm text-gray-500">
                        Click to browse or drag and drop your video file here
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Supported formats:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">MP4</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">MOV</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">MKV</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <Play className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{selectedFile.name}</p>
                      <p className="text-sm text-blue-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-blue-400 hover:text-blue-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Developer Mode Button */}
          <div className="text-center mb-8">
            <button
              onClick={() => setShowDevModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-all duration-200"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Are you in development?
            </button>
          </div>

          {/* Video Gallery Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Videos</h2>
              <button
                onClick={fetchAllVideos}
                disabled={loadingVideos}
                className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
              >
                {loadingVideos ? (
                  <>
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Loading...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>

            {loadingVideos && allVideos.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : allVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No videos yet</p>
                <p className="text-sm text-gray-400">Upload your first video to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allVideos.map((video) => (
                  <div
                    key={video.folder}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative group">
                      <Play className="w-12 h-12 text-gray-400" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                        <button
                          onClick={() => handleViewVideo(video)}
                          className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-200 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium"
                        >
                          Watch Video
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate" title={video.folder}>
                        {video.folder}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {video.url.length} file{video.url.length !== 1 ? 's' : ''}
                      </p>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewVideo(video)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all duration-200"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video.folder)}
                          disabled={deletingVideoId === video.folder}
                          className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all duration-200"
                        >
                          {deletingVideoId === video.folder ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SignedIn>

        <SignedOut>
          {/* Sign In Prompt */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to upload and manage your videos
              </p>
              <SignInButton>
                <span className="inline-flex items-center">
                  Sign In
                </span>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        {/* Developer Modal */}
        {showDevModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Developer Testing</h2>
                  <button
                    onClick={() => setShowDevModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-all duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Test</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Test the Video.js HLS player with a sample video:
                  </p>
                  <button
                    onClick={loadTestData}
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all duration-200"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Load Test Video
                  </button>
                </div>

                <div className="border-t border-gray-200 my-6"></div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Paste API Response</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Paste your API response JSON here to test with your own transcoded videos:
                  </p>
                  
                  <div className="space-y-4">
                    <textarea
                      value={pastedResponse}
                      onChange={(e) => setPastedResponse(e.target.value)}
                      placeholder='{"success": true, "data": {"masterUrl": "...", "variantUrls": {...}, "videoId": "...", "videoPath": "..."}}'
                      className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handlePastedResponse}
                        disabled={!pastedResponse.trim()}
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Load Response
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Video Player Section */}
        {videoData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Video.js HLS Player</h2>
              <div className="flex items-center space-x-2">
                {showTestData && (
                  <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Test Video
                  </span>
                )}
                <button
                  onClick={clearVideo}
                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="mb-6">
              <div data-vjs-player>
                <video
                  ref={videoRef}
                  className="video-js vjs-default-skin"
                  data-setup="{}"
                  preload="metadata"
                  style={{ aspectRatio: '16/9' }}
                >
                  <p className="vjs-no-js">
                    To view this video please enable JavaScript, and consider upgrading to a web browser that
                    <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
                      supports HTML5 video
                    </a>.
                  </p>
                </video>
              </div>
            </div>

            {/* Video Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Video Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video ID</label>
                    <p className="text-sm text-gray-900 font-mono">{videoData.videoId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video Path</label>
                    <p className="text-sm text-gray-900 font-mono">{videoData.videoPath}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Master Playlist</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={videoData.masterUrl}
                    readOnly
                    className="flex-1 text-sm p-2 border border-gray-300 rounded bg-gray-50 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(videoData.masterUrl)}
                    className="p-2 text-gray-600 hover:text-gray-800"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Variant URLs</h3>
                <div className="space-y-2">
                  {Object.entries(videoData.variantUrls).map(([quality, url]) => (
                    <div key={quality} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 w-12">{quality}:</span>
                      <input
                        type="text"
                        value={url}
                        readOnly
                        className="flex-1 text-sm p-2 border border-gray-300 rounded bg-gray-50 font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(url)}
                        className="p-2 text-gray-600 hover:text-gray-800"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;