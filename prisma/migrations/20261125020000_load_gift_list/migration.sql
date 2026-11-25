-- Carga la lista real de regalos de Sofía & Cristóbal y los datos del evento.
-- Migración de datos (corre una sola vez por base). Los regalos que ya tienen
-- aportes no se tocan, para no romper el historial de pagos.

UPDATE "Registry" SET
  "weddingDate" = '2027-03-26 15:00:00',
  "eventTime" = 'De 14:00 a 00:00 horas',
  "venue" = 'Punta Los Lunes, Puchuncaví',
  "welcomeMessage" = 'Su compañía es nuestro mejor regalo. Pero si además quieren regalarnos algo, aquí va nuestra lista (100% honesta).',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'sofia-y-cristobal';

DELETE FROM "Item" i
USING "Registry" r
WHERE i."registryId" = r."id"
  AND r."slug" = 'sofia-y-cristobal'
  AND NOT EXISTS (SELECT 1 FROM "Contribution" c WHERE c."itemId" = i."id");

INSERT INTO "Item" ("id", "registryId", "name", "description", "price", "stock", "order", "createdAt", "updatedAt")
SELECT v.id, r."id", v.name, v.description, v.price, v.stock, v.ord, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Registry" r
CROSS JOIN (VALUES
  ('regalo_01', 'cm de estatura para Sofía', 'Para que llegue a la repisa de arriba sin pedir ayuda. Cada aporte suma 1 cm.', 15000, 10, 1),
  ('regalo_02', 'La bici que Cristóbal no se compró por pagar el anillo', 'Eligió el anillo antes que la bici. Es hora de devolverle el pedaleo.', 50000, 8, 2),
  ('regalo_03', 'Thermomix para que la Sofía no cocine', 'La Thermomix cocina, Sofía descansa y todos comemos mejor.', 60000, 15, 3),
  ('regalo_04', 'Motorhome para recorrer la Patagonia', 'Carretera Austral, mate y cero reservas de hotel.', 100000, 20, 4),
  ('regalo_05', 'Un talonario de recetas para Cristóbal', 'Porque las recetas se acaban más rápido que el turno.', 20000, 5, 5),
  ('regalo_06', 'Un chaleco anti balas para el Cesfam', 'Elemento de protección personal, versión atención primaria.', 45000, 3, 6),
  ('regalo_07', 'Paciencia para Cristóbal', 'Dosis diaria recomendada: harta.', 25000, 10, 7),
  ('regalo_08', 'Paciencia para Sofía', 'Se administra en dosis generosas, idealmente antes del desayuno.', 25000, 10, 8),
  ('regalo_09', 'Bencina gratis por un año', 'Cada aporte llena el estanque por un mes. Son 12 meses.', 50000, 12, 9),
  ('regalo_10', 'Una rodilla nueva para Sofía', 'Repuesto original, con garantía para bailar hasta las 00:00.', 60000, 5, 10),
  ('regalo_11', 'Un crucero a la Antartida', 'Pingüinos, hielo y nada de señal de celular.', 100000, 20, 11),
  ('regalo_12', 'Un viaje a Islandia, Noruega y Finlandia', 'Persiguiendo auroras boreales por el norte de Europa.', 100000, 20, 12),
  ('regalo_13', 'Un paseo por Canadá y Alaska', 'Osos, glaciares y mucha ropa térmica.', 100000, 20, 13),
  ('regalo_14', 'Ropa nueva para Cristóbal', 'Una renovación de clóset largamente postergada.', 35000, 5, 14),
  ('regalo_15', 'Huevitos de pascua para el viernes Santo', 'La boda cae justo en Viernes Santo. El conejo también está invitado.', 10000, 20, 15)
) AS v(id, name, description, price, stock, ord)
WHERE r."slug" = 'sofia-y-cristobal'
ON CONFLICT ("id") DO NOTHING;
