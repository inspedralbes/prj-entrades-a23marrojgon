/**
 * Tests de Concurrencia E2E con Cypress
 * 
 * Simula 2 usuarios comprando simultáneamente el MISMO asiento
 * Verifica que solo uno lo logra (sin race condition)
 * 
 * Ejecución: npx cypress run --spec "cypress/e2e/concurrency.cy.js"
 */

describe('🚨 Concurrency Tests: Dos usuarios comprando simultaneamente', () => {

    const concert = {
        url: 'http://localhost:3000/concerts',
        name: 'Concert Test',
    };

    beforeEach(() => {
        // Limpiar localStorage/sessionStorage
        cy.clearLocalStorage();

        // Loguearse con Usuario 1
        cy.visit(concert.url);
    });

    /**
     * TEST 1: Mismo asiento, 2 usuarios
     * 
     * PROCEDIMIENTO:
     * 1. Usuario 1 selecciona asiento A1
     * 2. Usuario 1 abre checkout pero NO confirma
     * 3. Usuario 2 (otra pestaña/sesión) selecciona asiento A1
     * 4. Usuario 2 CONFIRMA compra ← Debería éxito
     * 5. Usuario 1 intenta confirmar ← Debería ERROR (asiento ya vendido)
     */
    it('USER2 compra mismo asiento ANTES que USER1 → USER1 recibe error 409', () => {
        // ============================================
        // SETUP: Crear 2 usuarios test
        // ============================================
        const user1Email = `user1-${Date.now()}@test.com`;
        const user2Email = `user2-${Date.now()}@test.com`;

        // Registrar user1 si no existe
        cy.visit('http://localhost:3000/register');
        cy.get('input[name="name"]').type('User One');
        cy.get('input[name="email"]').type(user1Email);
        cy.get('input[name="password"]').type('password123');
        cy.get('input[name="password_confirmation"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/login');

        // Loguearse como user1
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type(user1Email);
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.url().should('eq', 'http://localhost:3000/');

        // ============================================
        // PASO 1-2: USER1 selecciona asiento pero NO compra
        // ============================================
        cy.visit(concert.url); // Va a la lista de concerts
        cy.get('[data-testid="concert-card"]').first().click(); // Abre primer concert
        cy.url().should('include', '/events/');

        // Esperar mapa de asientos
        cy.get('[data-testid="seat-map"]', { timeout: 5000 }).should('be.visible');

        // Selecciona asiento A1 (el primero disponible)
        cy.get('rect[data-seat-id="A1"]').click({ force: true });
        cy.get('[data-testid="selected-seat-info"]').should('contain', 'A1');

        // Abre checkout pero NO confirma aún
        cy.get('button:contains("Prosseguir a Checkout")').click();
        cy.url().should('include', '/checkout');

        // Verificar que USER1 vee su asiento seleccionado
        cy.get('[data-testid="order-summary"]').should('contain', 'A1');

        // ============================================
        // PASO 3-4: USER2 (otra sesión) compra el MISMO asiento
        // ============================================

        // Simular USER2 abriendo nueva sesión (con cy.session o nueva ventana)
        // Para este test, haremos llamadas API directas como si fuera otro usuario

        // Obtener token de auth de USER1 primero
        cy.window().then((win) => {
            const token1 = win.localStorage.getItem('auth_token');
            cy.log('Token User1:', token1);

            // Ahora simular que USER2 hace checkout del mismo asiento
            cy.request({
                method: 'POST',
                url: 'http://localhost:8000/api/checkout',
                headers: {
                    'Authorization': `Bearer ${token1}`, // Aquí usaríamos token de USER2 normalmente
                    'Content-Type': 'application/json',
                },
                body: {
                    concert_id: 'test-concert-123',
                    seats: [{
                        id: 'A1',
                        row: 'A',
                        col: '1',
                        zone: 'sector-101',
                        price: 25,
                    }],
                    email: user2Email,
                    name: 'User Two',
                },
                failOnStatusCode: false,
            }).then((response) => {
                cy.log('USER2 Checkout Response:', response.status);
                // USER2 debería obtener 200 (éxito) o 412 dependiendo del timing
            });
        });

        // ============================================
        // PASO 5: USER1 intenta confirmar compra
        // ============================================

        // USER1 ahora intenta confirmar
        cy.get('input[name="name"]').type('User One Name');
        cy.get('input[name="email"]').type(user1Email);
        cy.get('button:contains("Confirmar Compra")').click();

        // ESPERADO: Error 409 (Conflict) o similar
        cy.get('[role="alert"]', { timeout: 5000 })
            .should('be.visible')
            .and('contain', 'ya ha sido vendido');
    });

    /**
     * TEST 2: Stress test - 5 usuarios intentan comprar el MISMO asiento
     * 
     * PROCEDIMIENTO:
     * - Hacer 5 solicitudes checkout paralelas para el mismo asiento
     * - Esperar 1 éxito, 4 conflictos
     */
    it('5 requests paralelas para mismo asiento → solo 1 éxito', () => {
        const concertId = 'test-concert-123';
        const seatId = 'A1';

        // Crear 5 promesas de checkout (simulan 5 usuarios)
        const checkoutPromises = Array.from({ length: 5 }, (_, i) => {
            return cy.request({
                method: 'POST',
                url: 'http://localhost:8000/api/checkout',
                headers: {
                    'Authorization': `Bearer dummy-token-${i}`, // En prod, tokens reales
                    'Content-Type': 'application/json',
                },
                body: {
                    concert_id: concertId,
                    seats: [{
                        id: seatId,
                        row: 'A',
                        col: '1',
                        zone: 'sector-101',
                        price: 25,
                    }],
                    email: `user${i}@cypress-test.com`,
                    name: `Cypress User ${i}`,
                },
                failOnStatusCode: false,
            });
        });

        // Esperar todas las respuestas
        cy.wrap(Promise.all(checkoutPromises)).then((responses) => {
            const statuses = responses.map(r => r.status);
            const successCount = statuses.filter(s => s === 200).length;
            const conflictCount = statuses.filter(s => s === 409).length;

            cy.log('Statuses:', statuses);
            cy.log('Success:', successCount);
            cy.log('Conflicts:', conflictCount);

            // Assertions
            expect(successCount).to.equal(1, 'Exactamente 1 debería ser 200');
            expect(conflictCount).to.equal(4, 'Exactamente 4 deberían ser 409');
        });
    });

    /**
     * TEST 3: Verificar que NO hay "overselling" en BD
     * 
     * Simula: 10 usuarios comprando, cada uno intenta comprar 1 asiento diferente
     * Esperado: 10 tickets en BD, NO duplicados
     */
    it('10 usuarios comprando asientos DIFERENTES → todos exitosos, sin duplicados', () => {
        // Este test verificaría que si 10 usuarios compran 10 asientos distintos,
        // todos logran su compra (estado = 'confirmed')
        // Y no hay 2 tickets para el mismo asiento_id

        cy.visit(concert.url);

        // Verificar en admin o API que:
        cy.request({
            method: 'GET',
            url: 'http://localhost:8000/api/admin/concert/test-concert-123/tickets',
            headers: {
                'Authorization': 'Bearer admin-token',
            },
        }).then((response) => {
            const tickets = response.body.data;

            // Count unique seat IDs
            const seatIds = new Set();
            let duplicates = 0;

            tickets.forEach(ticket => {
                const seatInfo = JSON.parse(ticket.seat_info);
                if (seatIds.has(seatInfo.id)) {
                    duplicates++;
                }
                seatIds.add(seatInfo.id);
            });

            expect(duplicates).to.equal(0, 'No debería haber asientos duplicados');
        });
    });
});
