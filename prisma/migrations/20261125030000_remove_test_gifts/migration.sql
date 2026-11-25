-- Elimina los 3 regalos de ejemplo que quedaron porque tenían aportes de
-- prueba (pagos de sandbox al configurar Mercado Pago), junto con esos aportes.
DELETE FROM "Contribution"
WHERE "itemId" IN ('item_hotel_boutique', 'item_cena_romantica', 'item_spa_pareja');

DELETE FROM "Item"
WHERE "id" IN ('item_hotel_boutique', 'item_cena_romantica', 'item_spa_pareja');
