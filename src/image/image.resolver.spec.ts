import { Test, TestingModule } from '@nestjs/testing';
import { ImageResolver } from './image.resolver';
import { ImageService } from './image.service';

describe('ImageResolver', () => {
  let resolver: ImageResolver;
  let imageService: ImageService;

  const mockImages = [
    { id: '1', url: 'image1.jpg', caption: 'Test Image 1' },
    { id: '2', url: 'image2.jpg', caption: 'Test Image 2' },
  ];

  const mockImageService = {
    findByPropertyId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageResolver,
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    resolver = module.get<ImageResolver>(ImageResolver);
    imageService = module.get<ImageService>(ImageService);
  });

  describe('propertyImages', () => {
    it('should return images for a property', async () => {
      mockImageService.findByPropertyId.mockResolvedValue(mockImages);

      const result = await resolver.propertyImages('1');
      expect(result).toEqual(mockImages);
      expect(imageService.findByPropertyId).toHaveBeenCalledWith('1');
    });
  });
}); 