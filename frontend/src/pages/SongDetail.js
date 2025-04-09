import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Button,
    CircularProgress,
    Alert,
    Divider,
    IconButton,
    Slider,
    useTheme
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import songService from '../services/songService';
import { getCountryCoordinates } from '../utils/coordinates';

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const SongDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [song, setSong] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const audioRef = React.useRef(null);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const songData = await songService.getSongById(id);
                console.log('Received song data:', songData);
                
                // Process audio URLs
                if (songData.versions) {
                    songData.versions = songData.versions.map(version => ({
                        ...version,
                        audioUrl: songService.getAudioUrl(version.audioUrl)
                    }));
                }
                
                setSong(songData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching song:', error);
                setError('Failed to load song details');
                setLoading(false);
            }
        };

        fetchSong();
    }, [id]);

    // Initialize map when song data is loaded
    useEffect(() => {
        if (!song || !mapContainer.current) return;

        const country = song.versions?.[0]?.country;
        if (!country) return;

        const coordinates = getCountryCoordinates(country);
        if (!coordinates) return;

        if (!map.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/light-v11',
                center: coordinates,
                zoom: 4
            });

            map.current.on('load', () => {
                // Add marker for the song's location
                const el = document.createElement('div');
                el.className = 'marker';
                el.style.backgroundColor = '#ff0000';
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';

                marker.current = new mapboxgl.Marker(el)
                    .setLngLat(coordinates)
                    .setPopup(new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<strong>${song.title}</strong><br>${country}`))
                    .addTo(map.current);
            });
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [song]);

    const handlePlayPause = () => {
        const audioUrl = song.versions?.[0]?.audioUrl;
        console.log('Attempting to play audio with URL:', audioUrl);

        if (!audioUrl) {
            console.error('No audio URL available');
            setError('No audio file available for this song');
            return;
        }

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
                setError('Failed to load audio file. Please try again later.');
            };

            // Set the audio source and load it
            audioRef.current.src = cleanUrl;
            audioRef.current.crossOrigin = 'anonymous';
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
                    setError('Failed to play audio. Please try again later.');
                });
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
    };

    const handleSliderChange = (event, newValue) => {
        audioRef.current.currentTime = newValue;
        setCurrentTime(newValue);
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
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
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/')}
                        sx={{ mt: 2 }}
                    >
                        Back to Home
                    </Button>
                </Paper>
            </Container>
        );
    }

    if (!song) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        Song not found
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/')}
                        sx={{ mt: 2 }}
                    >
                        Back to Home
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate('/')} size="large">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                    {song.title}
                </Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ mb: 3, position: 'relative' }}>
                            <img
                                src={songService.getImageUrl(song.imageUrl)}
                                alt={song.title}
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    objectFit: 'cover',
                                    borderRadius: '8px'
                                }}
                            />
                        </Box>
                        <Typography variant="h6" gutterBottom>
                            Song Details
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="text.secondary">
                                Original Artist
                            </Typography>
                            <Typography variant="body1">
                                {song.originalArtist}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="text.secondary">
                                Genre
                            </Typography>
                            <Typography variant="body1">
                                {song.genre}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="text.secondary">
                                Original Language
                            </Typography>
                            <Typography variant="body1">
                                {song.originalLanguage}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="text.secondary">
                                Country
                            </Typography>
                            <Typography variant="body1">
                                {song.versions?.[0]?.country || 'Unknown'}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="text.secondary">
                                Original Lyrics
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {song.originalLyrics}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Location
                        </Typography>
                        <Box 
                            ref={mapContainer} 
                            sx={{ 
                                height: 300, 
                                width: '100%',
                                borderRadius: 1,
                                overflow: 'hidden'
                            }} 
                        />
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Audio Player
                        </Typography>
                        {song.versions?.[0]?.audioUrl ? (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <IconButton onClick={handlePlayPause} size="large">
                                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                    </IconButton>
                                    <Box sx={{ flex: 1 }}>
                                        <Slider
                                            value={currentTime}
                                            max={duration}
                                            onChange={handleSliderChange}
                                            sx={{ mx: 2 }}
                                        />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                            <Typography variant="body2">
                                                {formatTime(currentTime)}
                                            </Typography>
                                            <Typography variant="body2">
                                                {formatTime(duration)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton onClick={() => handleVolumeChange(volume === 0 ? 1 : 0)}>
                                        {volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                                    </IconButton>
                                    <Slider
                                        value={volume}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        onChange={(_, value) => handleVolumeChange(value)}
                                        sx={{ width: 100 }}
                                    />
                                </Box>
                                <audio
                                    ref={audioRef}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={() => setIsPlaying(false)}
                                />
                            </>
                        ) : (
                            <Typography color="error">
                                No audio file available for this song
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default SongDetail; 