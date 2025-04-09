import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    TextField,
    IconButton,
    Tooltip,
    Chip,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Collapse,
    Fade,
    Slider,
    useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import CloseIcon from '@mui/icons-material/Close';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import songService from '../services/songService';
import ChurchIcon from '@mui/icons-material/Church';
import { getCountryCoordinates } from '../utils/coordinates';
import { useAuth } from '../context/AuthContext';

// Helper function for time formatting
const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Map themes configuration
const MAP_THEMES = {
    'dark-v11': { name: 'Dark', markerColor: '#ff4444' },
    'streets-v12': { name: 'Streets', markerColor: '#ff0000' },
    'outdoors-v12': { name: 'Outdoors', markerColor: '#ff6b6b' },
    'light-v11': { name: 'Light', markerColor: '#ff0000' },
    'satellite-v9': { name: 'Satellite', markerColor: '#ff4444' },
    'satellite-streets-v12': { name: 'Satellite Streets', markerColor: '#ff4444' },
    'navigation-day-v1': { name: 'Navigation Day', markerColor: '#ff6b6b' },
    'navigation-night-v1': { name: 'Navigation Night', markerColor: '#ff4444' }
};

// Genre icons configuration
const GENRE_ICONS = {
    'Worship': '🎵',
    'Hymn': '📜',
    'Contemporary': '🎸',
    'Gospel': '🎹',
    'Traditional': '🎻',
    'default': '🎵'
};

// Mini Player component
const MiniPlayer = ({ 
    song, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    onPlayPause, 
    onSeek, 
    onVolumeChange, 
    onNext, 
    onPrevious,
    onClose 
}) => {
    const theme = useTheme();
    
    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                backgroundColor: '#2a2a2a',
                boxShadow: 3,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <img 
                    src="/song-placeholder.jpg" 
                    alt={song?.title} 
                    style={{ width: 40, height: 40, borderRadius: 4 }}
                />
                <Box>
                    <Typography variant="subtitle1" noWrap>
                        {song?.title || 'No song selected'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {song?.originalArtist || 'Unknown artist'}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 2 }}>
                <IconButton onClick={onPrevious} size="small">
                    <SkipPreviousIcon />
                </IconButton>
                <IconButton onClick={onPlayPause} size="large">
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={onNext} size="small">
                    <SkipNextIcon />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 45 }}>
                    {formatTime(currentTime)}
                </Typography>
                <Slider
                    value={currentTime}
                    max={duration}
                    onChange={(_, value) => onSeek(value)}
                    sx={{ mx: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: 45 }}>
                    {formatTime(duration)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 150 }}>
                <IconButton onClick={() => onVolumeChange(volume === 0 ? 1 : 0)} size="small">
                    {volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <Slider
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(_, value) => onVolumeChange(value)}
                    sx={{ mx: 1 }}
                />
            </Box>

            <IconButton onClick={onClose} size="small">
                <CloseIcon />
            </IconButton>
        </Paper>
    );
};

// Map component
const Map = ({ songs, navigate }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [markers, setMarkers] = useState([]);
    const [filteredSongs, setFilteredSongs] = useState(songs);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTheme, setCurrentTheme] = useState('mapbox://styles/mapbox/light-v11');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSong, setSelectedSong] = useState(null);
    const [showList, setShowList] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [filters, setFilters] = useState({
        language: '',
        genre: '',
        country: ''
    });
    const [volume, setVolume] = useState(1);
    const [showMiniPlayer, setShowMiniPlayer] = useState(false);
    const audioContext = useRef(null);
    const analyser = useRef(null);
    const dataArray = useRef(null);
    const animationFrame = useRef(null);
    const mediaSource = useRef(null);
    const audioRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Get unique values for filters
    const languages = [...new Set(songs
        .filter(song => song.versions?.length > 0)
        .map(song => song.versions[0]?.language)
        .filter(Boolean))];
    const genres = [...new Set(songs
        .filter(song => song.genre)
        .map(song => song.genre)
        .filter(Boolean))];
    const countries = [...new Set(songs
        .filter(song => song.versions?.length > 0)
        .map(song => song.versions[0]?.country)
        .filter(Boolean))];

    // Audio visualization setup
    const setupAudioVisualization = () => {
        if (!audioRef.current) return;

        try {
            // Clean up existing connections
            if (mediaSource.current) {
                mediaSource.current.disconnect();
                mediaSource.current = null;
            }
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
                animationFrame.current = null;
            }

            // Create new audio context if needed
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
                analyser.current = audioContext.current.createAnalyser();
                analyser.current.fftSize = 256;
                dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
            }

            // Create and connect new media source
            mediaSource.current = audioContext.current.createMediaElementSource(audioRef.current);
            mediaSource.current.connect(analyser.current);
            analyser.current.connect(audioContext.current.destination);
        } catch (error) {
            console.error('Error setting up audio visualization:', error);
            // Clean up on error
            if (mediaSource.current) {
                mediaSource.current.disconnect();
                mediaSource.current = null;
            }
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
                animationFrame.current = null;
            }
        }
    };

    // Audio visualization animation
    const animateVisualization = () => {
        if (!analyser.current || !dataArray.current) return;
        
        try {
            analyser.current.getByteFrequencyData(dataArray.current);
            // Update visualization based on dataArray.current
            // This will be implemented in the marker animation
            
            animationFrame.current = requestAnimationFrame(animateVisualization);
        } catch (error) {
            console.error('Error in animation frame:', error);
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        }
    };

    // Enhanced audio playback functions
    const handlePlayPause = (songId) => {
        const song = songs.find(s => s._id === songId);
        if (!song || !song.versions?.[0]?.audioUrl) {
            console.error('No audio URL available for song:', songId);
            return;
        }

        const audioUrl = songService.getAudioUrl(song.versions[0].audioUrl);
        console.log('Attempting to play audio with URL:', audioUrl);

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Clean the URL before setting it
            const cleanUrl = audioUrl.replace(/\\/g, '/');
            console.log('Cleaned audio URL:', cleanUrl);
            
            // Set up error handling before setting the source
            audioRef.current.onerror = (e) => {
                console.error('Audio load error:', e);
                console.error('Audio element state:', {
                    src: audioRef.current.src,
                    error: audioRef.current.error,
                    networkState: audioRef.current.networkState
                });
            };

            // Set the audio source and load it
            audioRef.current.src = cleanUrl;
            audioRef.current.load();
            
            // Try to play the audio
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.error('Error playing audio:', err);
                    console.error('Audio element state:', {
                        src: audioRef.current.src,
                        error: audioRef.current.error,
                        networkState: audioRef.current.networkState
                    });
                });
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSliderChange = (event, newValue) => {
        // Ensure newValue is a valid number and within bounds
        const time = typeof newValue === 'number' ? newValue : parseFloat(newValue);
        if (isNaN(time) || time < 0 || time > duration) {
            console.error('Invalid time value:', time);
            return;
        }
        
        if (audioRef.current && !isNaN(time)) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const handleNext = () => {
        const currentIndex = songs.findIndex(s => s._id === selectedSong?._id);
        const nextIndex = (currentIndex + 1) % songs.length;
        handlePlayPause(songs[nextIndex]._id);
    };

    const handlePrevious = () => {
        const currentIndex = songs.findIndex(s => s._id === selectedSong?._id);
        const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
        handlePlayPause(songs[prevIndex]._id);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!selectedSong) return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    handlePlayPause(selectedSong._id);
                    break;
                case 'ArrowRight':
                    handleNext();
                    break;
                case 'ArrowLeft':
                    handlePrevious();
                    break;
                case 'ArrowUp':
                    handleVolumeChange(Math.min(volume + 0.1, 1));
                    break;
                case 'ArrowDown':
                    handleVolumeChange(Math.max(volume - 0.1, 0));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedSong, isPlaying, volume]);

    // Setup audio visualization
    useEffect(() => {
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
            if (mediaSource.current) {
                mediaSource.current.disconnect();
            }
            if (audioContext.current) {
                audioContext.current.close();
                audioContext.current = null;
            }
        };
    }, [selectedSong]);

    // Update marker animation based on audio visualization
    const updateMarkerAnimation = (marker, song) => {
        if (!dataArray.current || selectedSong?._id !== song._id) return;
        
        const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length;
        const scale = 1 + (average / 128) * 0.5; // Scale between 1 and 1.5
        
        const el = marker.getElement();
        el.style.transform = `scale(${scale})`;
    };

    // Filter songs based on search query and filters
    useEffect(() => {
        console.log('Filtering songs:', songs);
        
        // If no search query and no filters are active, show all songs
        if (!searchQuery && !filters.language && !filters.genre && !filters.country) {
            console.log('No active filters, showing all songs');
            setFilteredSongs(songs);
            return;
        }

        const filtered = songs.filter(song => {
            // Skip songs without versions or country only if we're filtering by country
            if (filters.country && (!song.versions?.length || !song.versions[0]?.country)) {
                console.log('Skipping song without version or country:', song._id);
                return false;
            }

            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                song.title.toLowerCase().includes(searchLower) ||
                song.originalArtist.toLowerCase().includes(searchLower) ||
                (song.versions[0]?.country?.toLowerCase().includes(searchLower) || '') ||
                (song.versions[0]?.language?.toLowerCase().includes(searchLower) || '') ||
                (song.genre?.toLowerCase().includes(searchLower) || '');

            const matchesLanguage = !filters.language || song.versions[0]?.language === filters.language;
            const matchesGenre = !filters.genre || song.genre === filters.genre;
            const matchesCountry = !filters.country || song.versions[0]?.country === filters.country;

            const shouldInclude = matchesSearch && matchesLanguage && matchesGenre && matchesCountry;
            console.log('Song filtering:', {
                songId: song._id,
                title: song.title,
                hasVersions: !!song.versions?.length,
                hasCountry: !!song.versions[0]?.country,
                country: song.versions[0]?.country,
                matchesSearch,
                matchesLanguage,
                matchesGenre,
                matchesCountry,
                shouldInclude
            });
            return shouldInclude;
        });
        console.log('Filtered songs:', filtered);
        setFilteredSongs(filtered);
    }, [searchQuery, songs, filters]);

    // Update markers when filtered songs change
    useEffect(() => {
        if (map.current && filteredSongs.length > 0) {
            // Only update markers if the style is loaded
            if (!map.current.isStyleLoaded()) {
                map.current.once('style.load', () => {
                    updateMarkers();
                });
            } else {
                updateMarkers();
            }
        }
    }, [filteredSongs]);

    // Add zoom level change handler
    useEffect(() => {
        if (map.current) {
            const handleZoomEnd = () => {
                updateMarkers();
            };

            map.current.on('zoomend', handleZoomEnd);

            return () => {
                map.current.off('zoomend', handleZoomEnd);
            };
        }
    }, []);

    const updateMarkers = () => {
        if (!map.current || !map.current.getStyle()) return;

        // Remove existing markers
        markers.forEach(marker => marker.remove());
        setMarkers([]);

        // If no songs, return early
        if (!filteredSongs || filteredSongs.length === 0) {
            console.log('No songs to display markers for');
            return;
        }

        // Create new markers
        const newMarkers = filteredSongs.map(song => {
            const version = song.versions[0]; // Get the first version
            if (!version || !version.coordinates) {
                console.log('Skipping song without coordinates:', song._id);
                return null;
            }

            const { lat, lng } = version.coordinates;
            
            // Create a custom marker element
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.innerHTML = `
                <div class="marker-content">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="#1976d2">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                </div>
            `;

            const marker = new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .setPopup(
                    new mapboxgl.Popup({ 
                        offset: 25,
                        className: 'custom-popup',
                        closeButton: true,
                        closeOnClick: false,
                        maxWidth: '300px'
                    })
                )
                .addTo(map.current);

            // Add popup content
            const imageUrl = songService.getImageUrl(song.imageUrl);
            console.log('Song image URL:', song.imageUrl);
            console.log('Constructed image URL:', imageUrl);
            
            marker.getPopup().setHTML(`
                <div class="song-popup">
                    <div class="song-popup-header">
                        <div class="song-popup-image">
                            <img src="${imageUrl}" alt="${song.title || 'Song'}" onerror="console.error('Image failed to load:', this.src)" />
                        </div>
                        <div class="song-popup-info">
                            <h3>${song.title || 'Untitled Song'}</h3>
                            <p class="artist">${song.originalArtist || 'Unknown Artist'}</p>
                        </div>
                    </div>
                    <div class="song-popup-details">
                        <div class="song-popup-tags">
                            <span class="tag country">${version.country || 'Unknown Country'}</span>
                            <span class="tag language">${version.language || 'Unknown Language'}</span>
                            <span class="tag genre">${song.category || 'Unknown Genre'}</span>
                        </div>
                        <div class="song-popup-actions">
                            <button class="play-button" onclick="handlePlayPause('${song._id}')">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                Play
                            </button>
                            <button class="view-button" onclick="handleViewDetails('${song._id}')">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `);

            return marker;
        }).filter(marker => marker !== null);

        setMarkers(newMarkers);

        // Only fit bounds if it's not the initial load
        if (newMarkers.length > 0 && !isInitialLoad) {
            const bounds = new mapboxgl.LngLatBounds();
            newMarkers.forEach(marker => bounds.extend(marker.getLngLat()));
            map.current.fitBounds(bounds, { padding: 50 });
        }
    };

    // Update isInitialLoad after the first marker update
    useEffect(() => {
        if (isInitialLoad && markers.length > 0) {
            setIsInitialLoad(false);
        }
    }, [markers]);

    // Update the global functions for popup interaction
    useEffect(() => {
        window.handlePlayPause = (songId) => {
            handlePlayPause(songId);
        };

        window.handleSliderChange = (value) => {
            const time = parseFloat(value);
            if (!isNaN(time)) {
                handleSliderChange(null, time);
            }
        };

        window.handleViewDetails = (songId) => {
            navigate(`/songs/${songId}`);
        };

        return () => {
            delete window.handlePlayPause;
            delete window.handleSliderChange;
            delete window.handleViewDetails;
        };
    }, [songs, selectedSong, isPlaying, currentTime, duration, navigate]);

    useEffect(() => {
        if (map.current) return;

        const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

        if (!accessToken) {
            console.error('Mapbox access token is not set in environment variables');
            return;
        }

        mapboxgl.accessToken = accessToken;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: currentTheme,
            center: [-95.7129, 37.0902], // Center on United States
            zoom: 3, // Adjusted zoom level to show most of the US
            minZoom: 1.2,
            maxZoom: 15,
            preserveDrawingBuffer: true
        });

        // Add navigation control only once during initial setup
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            setIsLoading(false);
            updateMarkers();
        });

        map.current.on('style.load', () => {
            setIsLoading(true);
            updateMarkers();
            setIsLoading(false);
        });

        map.current.on('error', (e) => {
            console.error('Mapbox error:', e);
            setIsLoading(false);
        });

        return () => {
            if (map.current) {
                markers.forEach(marker => marker.remove());
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (map.current) {
            setIsLoading(true);
            // Store current zoom and center before changing style
            const currentZoom = map.current.getZoom();
            const currentCenter = map.current.getCenter();
            
            // Remove existing markers before style change
            markers.forEach(marker => marker.remove());
            setMarkers([]);

            // Change the style
            map.current.setStyle(currentTheme);

            // Wait for the style to be fully loaded
            map.current.once('style.load', () => {
                // Restore zoom and center without animation
                map.current.zoomTo(currentZoom, { animate: false });
                map.current.panTo(currentCenter, { animate: false });

                // Update markers only after style is fully loaded
                setTimeout(() => {
                    updateMarkers();
                    setIsLoading(false);
                }, 100);
            });
        }
    }, [currentTheme]);

    return (
        <Box sx={{ 
            position: 'relative', 
            height: '100%',
            width: '100%'
        }}>
            {/* Theme Selector */}
            <Paper 
                sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16, 
                    zIndex: 1,
                    p: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
            >
                <FormControl size="small">
                    <InputLabel>Map Theme</InputLabel>
                    <Select
                        value={currentTheme}
                        label="Map Theme"
                        onChange={(e) => setCurrentTheme(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        {Object.entries(MAP_THEMES).map(([theme, { name }]) => (
                            <MenuItem key={theme} value={`mapbox://styles/mapbox/${theme}`}>
                                {name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Search Box */}
            <Paper 
                sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16, 
                    zIndex: 1,
                    p: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <TextField
                    size="small"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 200 }}
                />
                <Tooltip title="Search">
                    <IconButton size="small">
                        <SearchIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Filters">
                    <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
                        <FilterListIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Toggle List View">
                    <IconButton size="small" onClick={() => setShowList(!showList)}>
                        <MusicNoteIcon />
                    </IconButton>
                </Tooltip>
            </Paper>

            {/* Filters Panel */}
            <Collapse in={showFilters} sx={{ position: 'absolute', top: 60, left: 16, zIndex: 1 }}>
                <Paper sx={{ p: 2 }}>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                        <InputLabel>Language</InputLabel>
                        <Select
                            value={filters.language}
                            label="Language"
                            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                        >
                            <MenuItem key="all-languages" value="">All Languages</MenuItem>
                            {languages.map(lang => (
                                <MenuItem key={`lang-${lang}`} value={lang}>{lang}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                        <InputLabel>Genre</InputLabel>
                        <Select
                            value={filters.genre}
                            label="Genre"
                            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                        >
                            <MenuItem key="all-genres" value="">All Genres</MenuItem>
                            {genres.map(genre => (
                                <MenuItem key={`genre-${genre}`} value={genre}>{genre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                        <InputLabel>Country</InputLabel>
                        <Select
                            value={filters.country}
                            label="Country"
                            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                        >
                            <MenuItem key="all-countries" value="">All Countries</MenuItem>
                            {countries.map(country => (
                                <MenuItem key={`country-${country}`} value={country}>{country}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Paper>
            </Collapse>

            {/* Results Count */}
            <Paper 
                sx={{ 
                    position: 'absolute', 
                    bottom: 16, 
                    left: 16, 
                    zIndex: 1,
                    p: 1
                }}
            >
                <Chip 
                    label={`${filteredSongs.length} songs found`}
                    size="small"
                />
            </Paper>

            {/* Loading Indicator */}
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        p: 2,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <CircularProgress size={20} />
                    <Typography>Loading map...</Typography>
                </Box>
            )}

            {/* List View Drawer */}
            <Drawer
                anchor="right"
                open={showList}
                onClose={() => setShowList(false)}
                PaperProps={{
                    sx: { width: 300 }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Search Results
                    </Typography>
                    <List>
                        {filteredSongs.map((song, index) => (
                            <Fade in timeout={300} style={{ transitionDelay: `${index * 100}ms` }} key={song._id}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => navigate(`/songs/${song._id}`)}>
                                        <ListItemText
                                            primary={song.title}
                                            secondary={`${song.originalArtist} • ${song.versions[0]?.country}`}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            </Fade>
                        ))}
                    </List>
                </Box>
            </Drawer>

            {/* Mini Player */}
            {showMiniPlayer && selectedSong && (
                <MiniPlayer
                    song={selectedSong}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    volume={volume}
                    onPlayPause={() => handlePlayPause(selectedSong._id)}
                    onSeek={handleSliderChange}
                    onVolumeChange={handleVolumeChange}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onClose={() => setShowMiniPlayer(false)}
                />
            )}

            {/* Audio Element */}
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                }}
                style={{ display: 'none' }}
            />

            {/* Map Container */}
            <Box 
                ref={mapContainer} 
                sx={{ 
                    width: '100%', 
                    height: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }} 
            />

            {/* Add custom styles */}
            <style>
                {`
                    .custom-marker {
                        width: 40px;
                        height: 40px;
                        cursor: pointer;
                        transition: transform 0.2s ease;
                    }

                    .custom-marker:hover {
                        transform: scale(1.1);
                    }

                    .marker-content {
                        width: 100%;
                        height: 100%;
                        background: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        border: 2px solid #1976d2;
                    }

                    .custom-popup .mapboxgl-popup-content {
                        padding: 0;
                        border-radius: 8px;
                        overflow: hidden;
                    }

                    .song-popup {
                        font-family: 'Roboto', sans-serif;
                    }

                    .song-popup-header {
                        display: flex;
                        gap: 12px;
                        padding: 12px;
                        background: #f5f5f5;
                    }

                    .song-popup-image {
                        width: 60px;
                        height: 60px;
                        border-radius: 4px;
                        overflow: hidden;
                    }

                    .song-popup-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .song-popup-info {
                        flex: 1;
                    }

                    .song-popup-info h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #333;
                    }

                    .song-popup-info .artist {
                        margin: 4px 0 0;
                        font-size: 14px;
                        color: #666;
                    }

                    .song-popup-details {
                        padding: 12px;
                    }

                    .song-popup-tags {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 12px;
                        flex-wrap: wrap;
                    }

                    .tag {
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        background: #e3f2fd;
                        color: #1976d2;
                    }

                    .song-popup-actions {
                        display: flex;
                        gap: 8px;
                    }

                    .play-button, .view-button {
                        flex: 1;
                        padding: 8px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 4px;
                        transition: background-color 0.2s ease;
                    }

                    .play-button {
                        background: #1976d2;
                        color: white;
                    }

                    .play-button:hover {
                        background: #1565c0;
                    }

                    .view-button {
                        background: #f5f5f5;
                        color: #333;
                    }

                    .view-button:hover {
                        background: #e0e0e0;
                    }

                    .mapboxgl-popup-close-button {
                        padding: 8px;
                        font-size: 16px;
                        color: #666;
                    }

                    .mapboxgl-popup-close-button:hover {
                        background: #f5f5f5;
                    }
                `}
            </style>
        </Box>
    );
};

const FeaturedSongs = ({ songs }) => {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const audioRef = useRef(null);
    const [audioError, setAudioError] = useState(null);

    const handlePlay = (song) => {
        console.log('Play button clicked for song:', song);
        
        // Check if song has versions and audio URL
        if (!song.versions || !song.versions[0] || !song.versions[0].audioUrl) {
            console.error('Song has no audio URL:', song);
            setAudioError('This song has no audio available');
            return;
        }
        
        if (currentSong?._id === song._id && isPlaying) {
            // If the same song is playing, pause it
            console.log('Pausing current song');
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            // If a different song is playing, stop it
            if (audioRef.current) {
                console.log('Stopping previous song');
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            // Play the new song
            const audioUrl = songService.getAudioUrl(song.versions[0].audioUrl);
            console.log('Constructed audio URL:', audioUrl);
            
            if (audioUrl) {
                try {
                    if (!audioRef.current) {
                        console.log('Creating new audio element');
                        audioRef.current = new Audio();
                        audioRef.current.addEventListener('ended', () => {
                            console.log('Audio ended');
                            setIsPlaying(false);
                            setCurrentSong(null);
                        });
                        audioRef.current.addEventListener('error', (e) => {
                            console.error('Audio error:', e);
                            setAudioError('Failed to load audio');
                            setIsPlaying(false);
                            setCurrentSong(null);
                        });
                    }
                    
                    console.log('Setting audio source and playing');
                    audioRef.current.src = audioUrl;
                    audioRef.current.crossOrigin = 'anonymous';
                    
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log('Audio playing successfully');
                                setIsPlaying(true);
                                setCurrentSong(song);
                                setAudioError(null);
                            })
                            .catch(error => {
                                console.error('Error playing audio:', error);
                                setAudioError('Failed to play audio');
                                setIsPlaying(false);
                                setCurrentSong(null);
                            });
                    }
                } catch (error) {
                    console.error('Error setting up audio:', error);
                    setAudioError('Failed to set up audio');
                }
            } else {
                console.error('No audio URL available');
                setAudioError('No audio URL available');
            }
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    return (
        <Grid container spacing={3}>
            {songs.map((song) => (
                <Grid item xs={12} sm={6} md={4} key={song._id}>
                    <Card 
                        sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'transform 0.2s ease-in-out'
                            }
                        }}
                    >
                        <CardMedia
                            component="img"
                            height="200"
                            image={songService.getImageUrl(song.imageUrl)}
                            alt={song.title}
                            sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Typography gutterBottom variant="h6" component="h2">
                                {song.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {song.originalArtist}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {song.category}
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button size="small" color="primary" onClick={() => navigate(`/songs/${song._id}`)}>
                                Learn More
                            </Button>
                            <Button 
                                size="small" 
                                color="primary"
                                onClick={() => handlePlay(song)}
                                startIcon={currentSong?._id === song._id && isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            >
                                {currentSong?._id === song._id && isPlaying ? 'Pause' : 'Play'}
                            </Button>
                        </CardActions>
                        {audioError && currentSong?._id === song._id && (
                            <Typography variant="caption" color="error" sx={{ px: 2, pb: 1 }}>
                                {audioError}
                            </Typography>
                        )}
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [featuredSongs, setFeaturedSongs] = useState([]);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [markers, setMarkers] = useState([]);
    const [filteredSongs, setFilteredSongs] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentTheme, setCurrentTheme] = useState('mapbox://styles/mapbox/dark-v11');
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedSong, setSelectedSong] = useState(null);
    const [audioContext, setAudioContext] = useState(null);
    const [analyser, setAnalyser] = useState(null);
    const [audioElement, setAudioElement] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [audioError, setAudioError] = useState(null);

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await songService.getAllSongs();
                setSongs(response);
                // Set featured songs (for now, just take the first 3 songs)
                setFeaturedSongs(response.slice(0, 3));
            } catch (err) {
                console.error('Error fetching songs:', err);
                setError({
                    message: err.message || 'Failed to fetch songs',
                    details: err.details
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSongs();
    }, []);

    const handleReadyToShare = () => {
        if (!user) {
            // If user is not logged in, navigate to login page
            navigate('/login');
        } else {
            // If user is logged in, navigate to upload page
            navigate('/upload');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="error" variant="h6" gutterBottom>
                        {error.message}
                    </Typography>
                    {error.details && (
                        <Typography variant="body2" color="text.secondary">
                            {JSON.stringify(error.details)}
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.reload()}
                        sx={{ mt: 2 }}
                    >
                        Try Again
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: 'calc(100vh - 64px)', // Subtract navbar height
            overflow: 'hidden'
        }}>
            {/* Featured Songs Section */}
            <Box sx={{ 
                p: 3, 
                backgroundColor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <Container maxWidth="lg">
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 3
                    }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Welcome to LyricWorld
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={handleReadyToShare}
                            startIcon={<MusicNoteIcon />}
                        >
                            {user ? 'Ready to Share?' : 'Sign in to Share'}
                        </Button>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Featured Songs
                    </Typography>
                    <FeaturedSongs songs={featuredSongs} />
                </Container>
            </Box>

            {/* Map Section */}
            <Box sx={{ 
                flex: 1,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Map songs={songs} navigate={navigate} />
            </Box>
            <Box sx={{ 
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000
            }}>
                {/* Mini player will be rendered here */}
            </Box>
        </Box>
    );
};

export default Home; 