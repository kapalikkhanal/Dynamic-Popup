import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnhrasuxqsiwksjtlltx.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuaHJhc3V4cXNpd2tzanRsbHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5NTU3ODMsImV4cCI6MjAzODUzMTc4M30.vHGpUdYPz-KBmpRmcwfL7_kaGsK0d0ieWlt0j29sxXs";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to convert Blob to Base64
const convertBlobToBase64 = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await handlePost(req, res);
  } else if (req.method === 'GET') {
    await handleGet(req, res);
  } else if (req.method === 'PUT') {
    await handlePut(req, res);
  } else if (req.method === 'DELETE') {
    await handleDelete(req, res);
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handlePost(req, res) {
  try {
    const formData = await req.formData();
    const heading = formData.get('heading');
    const bodyText = formData.get('bodyText');
    const footerText = formData.get('footerText');
    const frequency = formData.get('frequency');
    const timeFrequency = formData.get('timeFrequency');
    const popup = formData.get('popup') === 'true';
    const onDay = formData.get('onDay');
    const image = formData.get('image');
    const previewImage = formData.get('previewImage');

    const previewImageBase64 = previewImage ? await convertBlobToBase64(previewImage) : null;

    // Check if there are already 3 active popups
    const { data: activePopups, error: activePopupsError } = await supabase
      .from('Dynamic Popup')
      .select('*')
      .eq('isActive', true);

    if (activePopupsError) throw activePopupsError;

    if (activePopups.length >= 2) {
      return res.status(400).json({ error: 'Maximum number of active popups reached' });
    }

    const popupConfig = {
      uuid: uuidv4(),
      heading,
      bodyText,
      footerText,
      previewImage: previewImageBase64,
      frequency,
      timeFrequency,
      popup,
      onDay,
      isActive: true,
    };

    const { data, error } = await supabase
      .from('Dynamic Popup')
      .insert([popupConfig]);

    if (error) throw error;

    res.status(200).json({
      message: 'Popup configuration received successfully',
      data: popupConfig,
    });
  } catch (error) {
    console.log('post error', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}

async function handleGet(req, res) {
  try {
    const { data: popups, error } = await supabase
      .from('Dynamic Popup')
      .select('*');

    if (error) throw error;

    res.status(200).json(popups);
  } catch (error) {
    console.log('get error', error);
    res.status(500).json({ error: 'Failed to retrieve popups' });
  }
}

async function handlePut(req, res) {
  try {
    const { uuid, popup } = req.body;

    const { data, error } = await supabase
      .from('Dynamic Popup')
      .update({ popup, isActive: popup })
      .eq('uuid', uuid);

    if (error) throw error;

    res.status(200).json({
      message: 'Popup updated successfully',
      data
    });
  } catch (error) {
    console.log('put error', error);
    res.status(500).json({ error: 'Failed to update popup' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from('Dynamic Popup')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      message: 'Popup deleted successfully',
    });
  } catch (error) {
    console.log('delete error', error);
    res.status(500).json({ error: 'Failed to delete popup' });
  }
}
