// Cours:       INF1900 - Projet initial de syst?me embarqu?
// Auteurs:     THOELEN Nathan
//              OUGADI Mehdi
//              ALLAIRE Mederic
//              WACRENIER Paul
// Date:        31 octobre 2022

#include "motor.h"

Motor::Motor()
{
    DDRD |= ((1<< PD4) | (1<< PD5));
    DDRB |= ((1<< PB0) | (1<< PB1));
    TCCR1A |= (1<<WGM10)|(1<<COM1A1)|(1<<COM1B1)|(1<<COM1A0)|(1<<COM1B0);
	TCCR1B |= (1<< CS11); //prescaler à 8
    stop();
}

void Motor::adjustPWM ( uint8_t rightPWM,uint8_t leftPWM) 
{
	OCR1A = rightPWM;
	OCR1B = leftPWM;
}

uint8_t Motor::percentageToInt(int percentage)
{
    if ( (percentage <= 100) && (percentage >= 0) )
    {
        return 255 - (percentage*maxValue)/100;
    }

    else { return 0; }
}

uint8_t Motor::intToPercentage(double value)
{
    return (value / maxValue) * 100;
}

void Motor::moveStraight(uint8_t percentage)
{
    uint8_t pwm = percentageToInt(percentage);
    PORTB &= ~(1 << PB0);
    PORTB &= ~(1 << PB1);
    adjustPWM(pwm, pwm);
}

void Motor::moveBack(uint8_t percentage)
{
    uint8_t pwm = percentageToInt(percentage);
    PORTB |= (1 << PB0);
    PORTB |= (1 << PB1);
    adjustPWM(pwm, pwm);
}

void Motor::turn(uint8_t percent1 , uint8_t percent2)
{
    uint8_t pwm1 = percentageToInt(percent1); //Left 
    uint8_t pwm2 = percentageToInt(percent2); //Right
    adjustPWM(pwm1, pwm2);
}

void Motor::stop()
{
    OCR1A=0xFF;
    OCR1B=0xFF;
}