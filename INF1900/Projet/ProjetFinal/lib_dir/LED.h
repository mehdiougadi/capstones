// Cours:       INF1900 - Projet initial de syst?me embarqu?
// Auteurs:     THOELEN Nathan
//              OUGADI Mehdi
//              ALLAIRE Mederic
//              WACRENIER Paul
// Date:        31 octobre 2022

#ifndef LED_H
#define LED_H

#define F_CPU 8000000

#include <avr/io.h>
#include <util/delay.h>

class Led 
{
public:
    Led();
    void colorGreen();
    void colorRed();
    void colorAmber();
    void noColor();
    void clignoterVert();
    void clignoterRouge();
    void clignoterAmbre();
};

#endif