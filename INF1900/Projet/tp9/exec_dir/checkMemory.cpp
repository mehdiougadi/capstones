// Cours:       INF1900 - Projet initial de syst�me embarqu�
// Auteurs:     THOELEN Nathan
//              OUGADI Mehdi
//              ALLAIRE Mederic
//              WACRENIER Paul
//              LAZZALI Younes
// Date:        03 novembre 2022

#include "memory.h"
#include "LED.h"
#include "usart.h"

int main()
{
    //Objets
    usart transmit;
    Memoire24CXXX mem;
    LED led;

    uint16_t address = 0x00;
    uint8_t data;

    while (true)
    {
       mem.lecture(address, &data);
        transmit.transmissionUART(data);
        _delay_ms(500);
        address++;
    }
}