// __tests__/store/useTicketStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTicketStore } from '@/store/useTicketStore'

describe('useTicketStore', () => {
    beforeEach(() => {
        // Reset store antes de cada test
        const { result } = renderHook(() => useTicketStore())
        act(() => {
            result.current.clearSelection()
            result.current.setSeats([])
        })
    })

    describe('Inicialización', () => {
        it('debe inicializarse vacío', () => {
            const { result } = renderHook(() => useTicketStore())

            expect(result.current.selectedSeats).toEqual([])
            expect(result.current.seats).toEqual([])
            expect(result.current.timerMinutes).toBe(0)
            expect(result.current.timerSeconds).toBe(0)
        })
    })

    describe('Gestión de asientos', () => {
        it('debe estabelir asientos correctamente', () => {
            const { result } = renderHook(() => useTicketStore())

            const mockSeats = [
                { id: 'A1', row: 'A', col: 1, zoneId: 'zone1', status: 'available' as const, price: 25 },
                { id: 'A2', row: 'A', col: 2, zoneId: 'zone1', status: 'available' as const, price: 25 },
            ]

            act(() => {
                result.current.setSeats(mockSeats)
            })

            expect(result.current.seats).toEqual(mockSeats)
            expect(result.current.seats.length).toBe(2)
        })

        it('debe seleccionar un asiento', () => {
            const { result } = renderHook(() => useTicketStore())

            const mockSeat = {
                id: 'A1',
                row: 'A',
                col: 1,
                zoneId: 'zone1',
                status: 'available' as const,
                price: 25
            }

            act(() => {
                result.current.toggleSeatSelection(mockSeat)
            })

            expect(result.current.selectedSeats).toContain(mockSeat)
            expect(result.current.selectedSeats.length).toBe(1)
        })

        it('debe deseleccionar un asiento si ya está seleccionado', () => {
            const { result } = renderHook(() => useTicketStore())

            const mockSeat = {
                id: 'A1',
                row: 'A',
                col: 1,
                zoneId: 'zone1',
                status: 'available' as const,
                price: 25
            }

            act(() => {
                result.current.toggleSeatSelection(mockSeat)
                result.current.toggleSeatSelection(mockSeat)
            })

            expect(result.current.selectedSeats).toEqual([])
        })

        it('debe actualizar el estado de un asiento', () => {
            const { result } = renderHook(() => useTicketStore())

            const mockSeats = [
                { id: 'A1', row: 'A', col: 1, zoneId: 'zone1', status: 'available' as const, price: 25 },
            ]

            act(() => {
                result.current.setSeats(mockSeats)
                result.current.updateSeatStatus('A1', 'sold')
            })

            expect(result.current.seats[0].status).toBe('sold')
        })
    })

    describe('Gestión de temporizador', () => {
        it('debe establecer el temporizador', () => {
            const { result } = renderHook(() => useTicketStore())

            act(() => {
                result.current.setTimer(5, 30)
            })

            expect(result.current.timerMinutes).toBe(5)
            expect(result.current.timerSeconds).toBe(30)
        })

        it('debe decrementar correctamente los segundos', () => {
            const { result } = renderHook(() => useTicketStore())

            act(() => {
                result.current.setTimer(1, 30)
                result.current.decrementTimer()
            })

            expect(result.current.timerMinutes).toBe(1)
            expect(result.current.timerSeconds).toBe(29)
        })

        it('debe decrementar minutos cuando segundos llega a 0', () => {
            const { result } = renderHook(() => useTicketStore())

            act(() => {
                result.current.setTimer(2, 0)
                result.current.decrementTimer()
            })

            expect(result.current.timerMinutes).toBe(1)
            expect(result.current.timerSeconds).toBe(59)
        })

        it('debe no bajar de 0:0', () => {
            const { result } = renderHook(() => useTicketStore())

            act(() => {
                result.current.setTimer(0, 0)
                result.current.decrementTimer()
            })

            expect(result.current.timerMinutes).toBe(0)
            expect(result.current.timerSeconds).toBe(0)
        })
    })

    describe('Gestión de selección', () => {
        it('debe limpiar la selección', () => {
            const { result } = renderHook(() => useTicketStore())

            const mockSeat = {
                id: 'A1',
                row: 'A',
                col: 1,
                zoneId: 'zone1',
                status: 'available' as const,
                price: 25
            }

            act(() => {
                result.current.toggleSeatSelection(mockSeat)
                result.current.clearSelection()
            })

            expect(result.current.selectedSeats).toEqual([])
        })

        it('debe calcular el precio total correctamente', () => {
            const { result } = renderHook(() => useTicketStore())

            const seats = [
                { id: 'A1', row: 'A', col: 1, zoneId: 'zone1', status: 'available' as const, price: 25 },
                { id: 'A2', row: 'A', col: 2, zoneId: 'zone1', status: 'available' as const, price: 30 },
                { id: 'A3', row: 'A', col: 3, zoneId: 'zone1', status: 'available' as const, price: 20 },
            ]

            act(() => {
                seats.forEach(seat => result.current.toggleSeatSelection(seat))
            })

            const total = result.current.selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
            expect(total).toBe(75)
        })
    })

    describe('Gestión de conciertos', () => {
        it('debe establecer el ID del concierto', () => {
            const { result } = renderHook(() => useTicketStore())

            act(() => {
                result.current.setConcertId('concert-123')
            })

            expect(result.current.concertId).toBe('concert-123')
        })

        it('debe resetear asientos seleccionados al cambiar de concierto', () => {
            const { result } = renderHook(() => useTicketStore())

            const mockSeat = {
                id: 'A1',
                row: 'A',
                col: 1,
                zoneId: 'zone1',
                status: 'available' as const,
                price: 25
            }

            act(() => {
                result.current.setConcertId('concert-1')
                result.current.toggleSeatSelection(mockSeat)
                result.current.setConcertId('concert-2')
            })

            expect(result.current.concertId).toBe('concert-2')
            expect(result.current.selectedSeats).toEqual([])
        })
    })

    describe('Flag de checkout', () => {
        it('debe establecer flag de checkout', () => {
            const { result } = renderHook(() => useTicketStore())

            act(() => {
                result.current.setProceedingToCheckout(true)
            })

            expect(result.current.isProceedingToCheckout).toBe(true)
        })
    })

    describe('Contador de compras', () => {
        it('debe establecer contador de compras', () => {
            const { result } = renderHook(() => useTicketStore())

            act(() => {
                result.current.setPurchasedCount(5)
            })

            expect(result.current.purchasedCount).toBe(5)
        })
    })
})
