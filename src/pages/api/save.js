// In your Next.js API routes
// /pages/api/save-image-buttons.js

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        await handlePost(req, res);
    } else if (req.method === 'GET') {
        await handleGet(req, res);
    } else {
        res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function handlePost(req, res) {
    if (req.method === 'POST') {
        const { image, buttons } = req.body;

        const data = {
            id: uuidv4(),
            image,
            buttons,
        };

        const dataDir = path.join(process.cwd(), 'data');
        const filePath = path.join(dataDir, `${data.id}.json`);

        // Ensure the directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save the data to a file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        res.status(200).json({ message: 'Data saved successfully', id: data.id });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}

async function handleGet(req, res) {
    if (req.method === 'GET') {
        const { id } = req.query;

        const filePath = path.join(process.cwd(), 'data', `${id}.json`);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath));
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: 'Data not found' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}