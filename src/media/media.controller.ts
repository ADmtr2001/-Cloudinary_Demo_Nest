import {
  BadRequestException,
  Controller,
  ParseArrayPipe,
} from '@nestjs/common';
import {
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadApiErrorResponse } from 'cloudinary';
import { GetImagesResponse } from './interfaces/get-images-response.interface';
import { Resource } from './interfaces/resource.interface';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  async getAllImages(
    @Query(
      'folderNames',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    folderNames: string[] = [],
    @Query(
      'resourceTypes',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    resourceTypes: string[] = [],
    @Query('limit') limit = '25',
    @Query('cursor') cursor = '',
  ): Promise<GetImagesResponse> {
    return this.mediaService.getAllImages(
      parseInt(limit, 10),
      folderNames,
      resourceTypes,
      cursor,
    );
  }

  @Get('folders')
  async getAllFolders(): Promise<any> {
    return this.mediaService.getAllFolders();
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Resource | UploadApiErrorResponse> {
    return this.mediaService.uploadImage(file).catch((error) => {
      throw new BadRequestException(error);
    });
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() video: Express.Multer.File,
  ): Promise<Resource | UploadApiErrorResponse> {
    return this.mediaService.uploadVideo(video);
  }

  @Delete('image')
  async deleteImage(@Query('publicId') publicId: string) {
    return this.mediaService.deleteImage(publicId);
  }

  @Delete('video')
  async deleteVideo(@Query('publicId') publicId: string) {
    return this.mediaService.deleteVideo(publicId);
  }
}
