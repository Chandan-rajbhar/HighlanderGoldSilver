const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://azibnvfxnsrocmobzswt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uNLQLczI2qACWRJDxAJTVg_mWyfHUJZ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = 'inventory';
const LOCAL_DIR = path.join(__dirname, '..', 'public', 'assets', 'items');

async function uploadLocalImages() {
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error('Directory not found:', LOCAL_DIR);
    return;
  }

  const files = fs.readdirSync(LOCAL_DIR);
  console.log(`Found ${files.length} images to upload to Supabase bucket '${BUCKET}'...`);

  let successCount = 0;
  for (const file of files) {
    const filePath = path.join(LOCAL_DIR, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `items/${file}`;
    const ext = path.extname(file).replace('.', '').toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.warn(`Failed to upload ${file}:`, error.message);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      console.log(`[OK] ${file} -> ${urlData.publicUrl}`);
      successCount++;
    }
  }

  console.log(`Upload complete! Successfully uploaded ${successCount}/${files.length} images.`);
}

uploadLocalImages();

