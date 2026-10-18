let fld = game.Workspace.WaitForChild("CurrentMonsters");

function doFor(child: Model) {
   let h = new Instance("Highlight", child);
}

fld.ChildAdded.Connect(child => doFor(child as Model));

fld.GetChildren().forEach(child => doFor(child as Model));

game.Workspace.WaitForChild("RunDebris").ChildAdded.Connect(child => doFor(child as Model));
game.Workspace.WaitForChild("RetrievalLoot").ChildAdded.Connect(child => doFor(child as Model));