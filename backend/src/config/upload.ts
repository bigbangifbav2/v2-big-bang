import multer, { type Options } from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url'; // <--- 1. IMPORTAR ISSO

// 2. RECRIAR __dirname E __filename PARA ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadFolder = path.resolve(__dirname, '..', '..', 'uploads');

// 1. Criamos um tipo personalizado que junta as opções do Multer com nossa propriedade extra
type UploadConfig = Options & {
    directory: string;
};

// 2. Tipamos a constante com esse novo tipo
const uploadConfig: UploadConfig = {
    directory: uploadFolder,

    storage: multer.diskStorage({
        destination: uploadFolder,
        filename(request, file, callback) {
            const fileHash = crypto.randomBytes(10).toString('hex');
            const fileName = `${fileHash}-${file.originalname.replace(/\s/g, '')}`;
            return callback(null, fileName);
        },
    }),

    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/pjpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.'));
        }
    },

    limits: {
        fileSize: 5 * 1024 * 1024,
    }
};

export default uploadConfig;