import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageService } from './image.service';
import { Image } from './entities/image.entity';

describe('ImageService', () => {
  let service: ImageService;
  let repository: Repository<Image>;

  const mockImages = [
    {
      id: '1',
      url: 'http://example.com/image1.jpg',
      caption: 'Beautiful view',
      createdAt: new Date('2024-03-06'),
      property: { id: '1' },
    },
    {
      id: '2',
      url: 'http://example.com/image2.jpg',
      createdAt: new Date('2024-03-07'),
      property: { id: '1' },
    },
  ];

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: getRepositoryToken(Image),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ImageService>(ImageService);
    repository = module.get<Repository<Image>>(getRepositoryToken(Image));
  });

  describe('findByPropertyId', () => {
    it('should return images for a property', async () => {
      mockRepository.find.mockResolvedValue(mockImages);

      const result = await service.findByPropertyId('1');

      expect(result).toEqual(mockImages);
      expect(repository.find).toHaveBeenCalledWith({
        where: { property: { id: '1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return an image by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockImages[0]);

      const result = await service.findById('1');

      expect(result).toEqual(mockImages[0]);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if image not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new image', async () => {
      const createImageDto = {
        url: 'http://example.com/new.jpg',
        caption: 'New image',
      };

      mockRepository.create.mockReturnValue({
        ...createImageDto,
        id: '3',
        createdAt: expect.any(Date),
        property: { id: '1' },
      });

      mockRepository.save.mockImplementation(entity => Promise.resolve(entity));

      const result = await service.create('1', createImageDto.url, createImageDto.caption);

      expect(result).toEqual({
        ...createImageDto,
        id: '3',
        createdAt: expect.any(Date),
        property: { id: '1' },
      });

      expect(repository.create).toHaveBeenCalledWith({
        url: createImageDto.url,
        caption: createImageDto.caption,
        property: { id: '1' },
        createdAt: expect.any(Date),
      });
    });
  });
}); 