import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlotImageCoordinates1735800000000 implements MigrationInterface {
  name = 'AddPlotImageCoordinates1735800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const plotsTable = await queryRunner.getTable('plots');
    if (plotsTable) {
      // Add fields for storing plot boundaries in image coordinates
      // imageBounds: JSON string storing {x, y, width, height} or polygon coordinates
      // imagePath: path to the map image file
      // imageWidth: original image width in pixels
      // imageHeight: original image height in pixels
      
      const hasImageBounds = plotsTable.findColumnByName('imageBounds');
      const hasImagePath = plotsTable.findColumnByName('imagePath');
      const hasImageWidth = plotsTable.findColumnByName('imageWidth');
      const hasImageHeight = plotsTable.findColumnByName('imageHeight');

      if (!hasImageBounds) {
        await queryRunner.query(`ALTER TABLE "plots" ADD COLUMN "imageBounds" text`);
      }
      if (!hasImagePath) {
        await queryRunner.query(`ALTER TABLE "plots" ADD COLUMN "imagePath" varchar`);
      }
      if (!hasImageWidth) {
        await queryRunner.query(`ALTER TABLE "plots" ADD COLUMN "imageWidth" integer`);
      }
      if (!hasImageHeight) {
        await queryRunner.query(`ALTER TABLE "plots" ADD COLUMN "imageHeight" integer`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const isPostgres = dbType === 'postgres';
    
    // SQLite doesn't support DROP COLUMN, so skip for SQLite
    if (!isPostgres) {
      return;
    }
    
    const plotsTable = await queryRunner.getTable('plots');
    if (plotsTable) {
      if (plotsTable.findColumnByName('imageBounds')) {
        await queryRunner.query(`ALTER TABLE "plots" DROP COLUMN "imageBounds"`);
      }
      if (plotsTable.findColumnByName('imagePath')) {
        await queryRunner.query(`ALTER TABLE "plots" DROP COLUMN "imagePath"`);
      }
      if (plotsTable.findColumnByName('imageWidth')) {
        await queryRunner.query(`ALTER TABLE "plots" DROP COLUMN "imageWidth"`);
      }
      if (plotsTable.findColumnByName('imageHeight')) {
        await queryRunner.query(`ALTER TABLE "plots" DROP COLUMN "imageHeight"`);
      }
    }
  }
}

