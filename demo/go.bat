@echo off
if '%1' == 'tab' goto tablet
if '%1' == 'tablet' goto tablet
if '%1' == 'debug' goto debug
if '%1' == 'clean' goto clean
if '%1' == '' goto phone
goto help

:help
echo Uknown command %1
goto end

:clean
pushd platforms\android
call gradlew clean
popd
goto end

:phone
tns.cmd run android --emulator --geny "Samsung Galaxy S5 - 4.4.4 - API 19"
goto end

:tablet
tns run android --emulator --geny "Custom Tablet - 6.0.0 - API 23 - 2560x1600"
goto end

:debug
tns.cmd debug android --emulator --geny "Samsung Galaxy S5 - 4.4.4 - API 19"
goto end


:end