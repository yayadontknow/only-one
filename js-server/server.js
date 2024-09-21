const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });  // For handling file uploads

// Mock disabled people database
const disabledPeopleDB = [
    {
        id: "760810017595",
        name: "MOHD HAFIZ BIN HALIM",
        profileImagePath: "E:\\Competitions\\ETH\\images\\man.png",
        isVerified: true  // `true` means disabled, `false` means not found or not disabled
    },
    {
        id: "030913011650",
        name: "KUEK EN YEE",
        profileImagePath: "E:\\Competitions\\ETH\\images\\woman.png",
        isVerified: true
    },
    {
        id: "030208081063",
        name: "Lee Wei Song",
        profileImagePath: "E:\\Competitions\\ETH\\images\\weisong.jpg",
        isVerified: true
    }
    // Add more entries here in the future...
];

// API to verify the national verifier based on ID
app.post('/api/verify-id', (req, res) => {
    const { nationalId } = req.body;

    // Search for the user in the disabled people database
    const user = disabledPeopleDB.find(person => person.id === nationalId);

    if (user) {
        // If found, return the status
        const imagePath = path.join(user.profileImagePath); // Adjust the path as necessary
    
        // Read the image file and convert it to Base64
        fs.readFile(imagePath, (err, data) => {
            if (err) {
                console.error("Error reading image file:", err);
                return res.json({
                    isVerified: user.isVerified,
                    profileImg: null // Return null if there's an error
                });
            }
    
            const base64Image = data.toString('base64');
            return res.json({
                isVerified: user.isVerified,
                profileImg: `data:image/jpeg;base64,${base64Image}` // Adjust the MIME type as necessary
            });
        });
    } else {
        // If not found, return not verified
        return res.json({
            isVerified: false
        });
    }
});

app.post('/api/compare-images', upload.single('capturedImage'), async (req, res) => {
    const { nationalId } = req.body;

    // Debug: Log the request body to ensure `nationalId` is present
    console.log('Request Body:', req.body);

    // Find the user's profile image in the database
    const user = disabledPeopleDB.find(person => person.id === nationalId);
    if (!user) {
        console.error('User not found for national ID:', nationalId);
        return res.status(404).json({ error: 'User not found in the database.' });
    }

    // Debug: Log user profile details
    console.log('User found:', user);

    // Debug: Log the uploaded file details
    console.log('Uploaded File:', req.file);

    try {
        // Load the profile image from the local filesystem
        const profileImagePath = user.profileImagePath;
        console.log('Profile Image Path:', profileImagePath);

        const profileImageStream = fs.createReadStream(profileImagePath);

        // Prepare data for the Python server
        const formData = new FormData();
        formData.append('image1', profileImageStream);  // Profile image from the database
        formData.append('image2', fs.createReadStream(req.file.path));  // Captured image from the user

        // Debug: Log form data for images (the paths will be printed)
        console.log('Form Data: Image1 (Profile) Path:', profileImagePath);
        console.log('Form Data: Image2 (Captured) Path:', req.file.path);

        // Send request to the Python server
        const response = await axios.post('http://127.0.0.1:5000/api/return_embeddings', formData, {
            headers: formData.getHeaders()
        });

        // Debug: Log the response from the Python server
        console.log('Response from Python Server:', response.data);

        const { embedding1, embedding2 } = response.data;

        // Debug: Log the embeddings
        console.log('Embedding 1:', embedding1);
        console.log('Embedding 2:', embedding2);

        res.json({ embedding1, embedding2 });
    } catch (error) {
        // Debug: Log full error details
        console.error('Error comparing images:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error comparing images.' });
    } finally {
        // Clean up the uploaded file
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);  // Delete the uploaded file
                console.log('Uploaded file deleted:', req.file.path);
            } catch (deleteError) {
                console.error('Error deleting uploaded file:', deleteError);
            }
        }
    }
});

// Start server
app.listen(3500, () => {
    console.log('Server running on http://localhost:3500');
});
