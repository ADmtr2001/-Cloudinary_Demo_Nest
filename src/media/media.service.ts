import { Injectable } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiOptions,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import { PassThrough } from 'stream';
import { Folder } from './interfaces/folder.interface';
import { GetImagesResponse } from './interfaces/get-images-response.interface';
import { Resource } from './interfaces/resource.interface';

@Injectable()
export class MediaService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getAllImages(
    limit: number,
    folderNames?: string[],
    resourceTypes?: string[],
    cursor?: string,
  ): Promise<GetImagesResponse> {
    try {
      let expression = '';

      if (resourceTypes?.length > 0) {
        expression = `resource_type:${resourceTypes.join(
          ' OR resource_type:',
        )}`;
      } else {
        expression = 'resource_type:image OR resource_type:video';
      }

      if (folderNames?.length > 0) {
        const folderExpressions = folderNames
          .map((folderName) => `folder:${folderName}`)
          .join(' OR ');
        expression = `(${folderExpressions}) AND (${expression})`;
      }

      const search = cloudinary.search
        .expression(expression)
        .sort_by('created_at', 'desc')
        .max_results(limit);

      if (cursor) {
        search.next_cursor(cursor);
      }

      const data = await search.execute();

      const filteredResources = data.resources.map(
        ({ secure_url, public_id, resource_type }) => ({
          secure_url,
          public_id,
          resource_type,
        }),
      );
      const result = {
        next_cursor: data.next_cursor,
        resources: filteredResources,
      };

      return result;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to retrieve images from Cloudinary');
    }
  }

  async getAllFolders(): Promise<Folder[]> {
    try {
      const foldersSearchResult = await cloudinary.api.root_folders();
      return foldersSearchResult.folders;
    } catch (error) {
      throw new Error('Failed to retrieve folders from Cloudinary');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<Resource | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const options: UploadApiOptions = {
        folder: 'test',
        resource_type: 'auto',
        overwrite: true,
        allowed_formats: ['jpg', 'jpeg', 'png'],
      };
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            const resource: Resource = {
              public_id: result.public_id,
              secure_url: result.secure_url,
              resource_type: result.resource_type,
            };
            resolve(resource);
          }
        },
      );
      const bufferStream = new PassThrough();
      bufferStream.end(file.buffer);
      bufferStream.pipe(stream);
    });
  }

  async uploadVideo(
    video: Express.Multer.File,
  ): Promise<Resource | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const options: UploadApiOptions = {
        folder: 'test',
        resource_type: 'video',
        overwrite: true,
        allowed_formats: ['mp4', 'webm', 'avi'],
      };
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            const resource: Resource = {
              public_id: result.public_id,
              secure_url: result.secure_url,
              resource_type: result.resource_type,
            };
            resolve(resource);
          }
        },
      );
      const bufferStream = new PassThrough();
      bufferStream.end(video.buffer);
      bufferStream.pipe(stream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  async deleteVideo(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
      });
    } catch (error) {
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }
}
