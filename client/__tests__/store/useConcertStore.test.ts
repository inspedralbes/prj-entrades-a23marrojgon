// __tests__/store/useConcertStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useConcertStore } from '@/store/useConcertStore'

describe('useConcertStore - Gestión de Conciertos', () => {
    it('debe conectar correctamente', () => {
        const { result } = renderHook(() => useConcertStore())

        act(() => {
            result.current.setConnected(true)
        })

        expect(result.current.isConnected).toBe(true)
    })

    it('debe establecer eventos', () => {
        const { result } = renderHook(() => useConcertStore())
        const mockEvents = [
            { id: '1', name: 'Concert 1', date: new Date() },
        ]

        act(() => {
            result.current.setEvents(mockEvents)
        })

        expect(result.current.events.length).toBe(1)
    })

    it('debe manejar errores', () => {
        const { result } = renderHook(() => useConcertStore())

        act(() => {
            result.current.setError('Test error')
        })

        expect(result.current.error).toBe('Test error')
    })

    it('debe cambiar estado de carga', () => {
        const { result } = renderHook(() => useConcertStore())

        act(() => {
            result.current.setLoading(true)
        })

        expect(result.current.isLoading).toBe(true)
    })

    it('debe registrar última actualización', () => {
        const { result } = renderHook(() => useConcertStore())
        const now = new Date().toISOString()

        act(() => {
            result.current.setLastUpdated(now)
        })

        expect(result.current.lastUpdated).toBe(now)
    })
})
