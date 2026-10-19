_G.tt = false;
task.wait(0.5);
_G.tt = true;
consolecreate()
while task.wait() and _G.tt do
   local input = consoleinput("ok >");
   print("CONSOLE INPUT:", input);
end

consoledestroy()