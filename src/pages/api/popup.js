import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnhrasuxqsiwksjtlltx.supabase.co';
const supabaseKey = process.env.SUPABASEKEY;
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
    const {
      heading,
      bodyText,
      footerText,
      frequency,
      timeFrequency,
      popup,
      onDay,
      previewImage
    } = req.body;
    // console.log(heading, bodyText, footerText, frequency, timeFrequency, popup, onDay);

    const base64Data = previewImage.replace(/^data:image\/png;base64,/, '');
    // console.log(base64Data)
    // Check if there are already 3 active popups
    const { data: activePopups, error: activePopupsError } = await supabase
      .from('Dynamic Popup')
      .select('*')
      .eq('isActive', true);

    const { data: recentPopups, error: recentPopupsError } = await supabase
      .from('Dynamic Popup')
      .select('*')
      .eq('isActive', false);

    if (activePopupsError) throw activePopupsError;
    if (recentPopupsError) throw recentPopupsError;

    if (activePopups.length >= 2 && recentPopups.length == 0) {
      return res.status(402).json({ message: 'Maximum number of active popups reached. Delete or deactivate ateast one to add new popup.' });
    }
    else if (recentPopups.length >= 2 && activePopups.length ==0) {
      return res.status(402).json({ message: 'Maximum number of recent popups reached. Delete or activate ateast one to add new popup.' });
    }
    else if (recentPopups.length == 1 && activePopups.length ==1) {
      return res.status(402).json({ message: 'Maximum number of popups reached. Delete ateast one to add a new popup.' });
    }

    const popupConfig = {
      uuid: uuidv4(),
      heading,
      bodyText,
      footerText,
      previewImage: base64Data,
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
      message: 'Popup has been added successfully.',
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
    const { uuid } = req.body;

    const { data, error } = await supabase
      .from('Dynamic Popup')
      .delete()
      .eq('uuid', uuid);

    if (error) throw error;

    res.status(200).json({
      message: 'Popup deleted successfully',
    });
  } catch (error) {
    console.log('delete error', error);
    res.status(500).json({ error: 'Failed to delete popup' });
  }
}
