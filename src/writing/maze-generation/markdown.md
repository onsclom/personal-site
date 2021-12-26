
Maze generation is a really interesting problem to implement. Think about how you would accomplish it for a bit. At first it seems like an impossible task to tackle. If you are anything like me, you give up on making an algorithm on your own and instead visit the [maze generation algorithm](https://en.wikipedia.org/wiki/Maze_generation_algorithm) wiki page. You skim through the many different algorithms until you find one that makes sense to you. If you are even more like me, the randomized depth first search is the only one that makes sense to you. 

You struggle through implementing it in Python. You run into issue after issue. After a lot of silly mistakes and long debugging sessions, you have some really messy Python code that creates mazes and displays them as characters in the terminal. Success! It feels really magical seeing these gigantic mazes generate instantly and you spend way too much time in awe generating puzzles of increasingly large sizes.

Ok, so maybe you are actually a better programmer than this. And I think I am a better programmer now too. This story was actually from a few years ago while I was still in college. I thought it would be a fun exercise to try revisiting this algorithm with an approach of "backwards programming". Instead of Python, this time I will use C. This should add to the challenge since C does not have a lot of the magic that comes in a higher-level language like Python.

First, we will learn from the mistakes of younger me. We will fully explore our plan and algorithm before we start the implementation. We will be making a command line program that prompts the user for the size of a maze to generate. Upon receiving a number from the user, it will generate a maze and print it to the terminal with "#" for the walls and spaces for the paths. Displaying a maze with text is actually not as straightforward as it may seem, so we should spend some time thinking about that. Normally mazes are displayed with skinny lines for walls.

![Maze example image](https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Prim_Maze.svg/1200px-Prim_Maze.svg.png)

Walls are shared with every touching grid square. Perhaps it is obvious that we will be using a 2d array to represent the data for our maze, but what is not obvious is that our array dimmensions will be different from our maze size. Look at an example for a small 5x5 maze rendered with text:
```
###########
# #   #   #
# # # # # #
# # #   # #
# ####### #
#       # #
# ##### # #
# #   # # #
# # # ### #
#   #     #
###########
```

Because walls need to be represented in the array alongside the core paths, this text grid actually ends up being 11x11. One solution would be to make each array index a struct which contains its wall data. In that case we would be able to get away with using a 5x5 2d array for a 5x5 maze. But since our ultimate goal is to display the maze in this 11x11 text format, I believe it is better to treat the data as such from the beginning. With a bit of deduction you might find that size*2+1 will give you the array dimensions required to represent the whole maze. An array of booleans is perfect because we only need to represent walls and paths.

With our maze representation fully explored, we can now look into the algorithm. We pick a random grid square, mark it as a path, and start our recursive exploration there. To recursively explore, we get all the currently walled neighbors, pick a random one, draw the path to it, recursively explore that neighbor, and finally recursively explore the original grid square. 

Recursion can be hard to wrap your head around, and for that reason I went with an iterative approach in my original implementation. But since recursion makes for a more elegant solution, I am opting for the recursive approach this time. If the recursive approach does not make sense to you yet, that is OK. [This gif](https://upload.wikimedia.org/wikipedia/commons/7/7d/Depth-First_Search_Animation.ogv) from Wikipedia is a great visualization of the algorithm we are using, and things will make more sense when we get to the recursive part in the implementation.



Time to start implementing! Prompting the user for input is pretty trivial.

```C
#include <stdio.h>

int main() 
{
  printf("Enter maze size: ");
  int userSize;
  scanf("%i", &userSize);
}
```

I actually really like the C way for getting basic input. C++'s `std::cout <<` and `std::cin >>` is definitely not as intuitive or readable, especially for a beginner. Now things get interesting. We will finish implementing the rest of `main` in one full sweep. This will include all the remaining high-level logic the rest of our program. If all goes well, we will not have to touch `main` again.

```C
int main()
{
  printf("Enter maze size: ");
  int userSize;
  scanf("%i", &userSize);

  Maze mazeData = InitializeMazeData(userSize);
  Vector2 startPos = PickRandomStart(userSize);

  MakePath(&mazeData, startPos);
  GenerateMaze(&mazeData, startPos);
  PrintMaze(&mazeData);
}
```

By pretending that we already wrote the perfect and complete implementation for our maze generation, we end with up calling some nonexistant functions. Running our code causes the compiler to yell at us, and that is really great! Why? If we simply implement all the things the computer is currently yelling at us for, we will have our finished program. We basically made ourselves a to do list and the compiler is helping push us along in a nice order. My compiler is actually giving me 3 warnings and 7 errors right now. The first ones are because `Maze` and `Vector2` are undeclared identifiers. We shall define those at the top of the program.

```C
typedef struct Vector2 
{
  int x;
  int y;
} Vector2;

typedef struct Maze 
{
  bool *grid;
  int size;
} Maze;
```

Next up is some crazy error messages and warnings for `InitializeMazeData` not being defined. Time to implement that.

```C
Maze InitializeMazeData(int userSize) 
{
  const int gridSize = userSize * 2 + 1;
  return (Maze){
      calloc(sizeof(bool), gridSize * gridSize),
      gridSize};
}
```

Some might argue this should not be a function since it is so short and only gets called once. I agree it would be fine to have done this in `main`, but I prefer making it a function because the name acts as an explanation comment. Doing this makes our `main` function extremely readable, even to people who are not familiar with C. Now the compiler complains about `PickRandomStart`. You know the drill.

```C
Vector2 PickRandomStart(int userSize) 
{
  srand(time(NULL)); // use current time as seed for rand
  Vector2 randPoint = {rand() % userSize, rand() % userSize};
  randPoint.x = randPoint.x * 2 + 1;
  randPoint.y = randPoint.y * 2 + 1;
  return randPoint;
}
```

That should be our last time touching `userSize` for doing conversions between user coordinates and `mazeData` coordinates! `MakePath` is very simple function, but will be used later on. Oh and now is probably a good time to add `#define WALL false` and `#define PATH true` at the top of our program!

```C
void MakePath(Maze *mazeData, Vector2 pos)
{
  const int gridSize = mazeData->size;
  mazeData->grid[pos.y * gridSize + pos.x] = PATH;
}
```

Now we get to the meat of the program: `GenerateMaze`. We should approach this function in a similar way to how we approached `main`. It will be useful to reference the algorithm summary we came up with while implementing this.

> To recursively explore, we get all the currently walled neighbors,
> pick a random one, draw the path to it, recursively explore that
> neighbor, and finally recursively explore the original grid square.

```C
void GenerateMaze(Maze *mazeData, Vector2 pos)
{
  Vector2 neighbors[4];
  const int neighborAmount = GetWalledNeighbors(mazeData, neighbors, pos);

  if (neighborAmount == 0)
    return;

  const int randNeighborNum = rand() % neighborAmount;
  const Vector2 randNeighbor = neighbors[randNeighborNum];
  MakePathAndConnect(mazeData, pos, randNeighbor);

  GenerateMaze(mazeData, randNeighbor);
  GenerateMaze(mazeData, pos);
}
```

Like in `main`, we worked backwards and pretended we already had functions made. This function holds the core logic of our algorithm. If you have some grid paper laying around, trying to execute this function by hand is a really great exercise. You could box yourself out 7x7 and try making a 3x3 maze. Next, we will do `IsWall` and `GetWalledNeighbors` together to save some time.

```C
bool IsWall(const Maze *mazeData, Vector2 pos)
{
  const int mazeSize = mazeData->size;
  if (pos.x < 0 || pos.y < 0 || pos.x >= mazeSize || pos.y >= mazeSize)
      return false; //out of bounds neighbors not considered
  return (mazeData->grid[mazeSize * pos.y + pos.x]) == WALL;
}

int GetWalledNeighbors(const Maze *mazeData, Vector2 neighbors[4], Vector2 pos)
{
  int neighborAmount = 0;
  const Vector2 possibleNeighbors[4] = {
      (Vector2){-2 + pos.x, pos.y},
      (Vector2){2 + pos.x, pos.y},
      (Vector2){pos.x, 2 + pos.y},
      (Vector2){pos.x, -2 + pos.y}};

  for (int i = 0; i < 4; i++)
  {
    Vector2 cur = possibleNeighbors[i];
    if (IsWall(mazeData, cur))
    {
      neighbors[neighborAmount] = cur;
      neighborAmount += 1;
    }
  }

  return neighborAmount;
}
```

Perhaps these functions can use a little explanation. `IsWall` does bounds checking and returns whether the given `pos` is currently a wall or not. `GetWalledNeighbors` both returns the amount of walled neighbors touching `pos` and  puts each neighbor's coordinates into the `neighbors` array. We are almost done and the rest of the program is really simple! All that is left is to implement two simple functions.

```C
void MakePathAndConnect(Maze *mazeData, Vector2 pos1, Vector2 pos2)
{
  const Vector2 inbetweenWall = (Vector2){
      (pos1.x + pos2.x) / 2,
      (pos1.y + pos2.y) / 2};
  MakePath(mazeData, inbetweenWall);
  MakePath(mazeData, pos2);
}

void PrintMaze(const Maze *mazeData)
{
  for (int y = 0; y < mazeData->size; y++) {
    printf("\n");
    for (int x = 0; x < mazeData->size; x++) {
      Vector2 curPos = {x, y};
      printf("%c", IsWall(mazeData, curPos) ? '#' : ' ');
    }
  }
}
```
It is tempting to make something as soon as you think you might need it. This process would have been very different if we started implementing `InitializeMazeData` as soon as deciding it was needed. We would not have had the high-level context of how the rest of our program would work. It is likely we would have initialized maze data in a naive way, causing future reworks and refactors. Notice how we never had to go back to refactor things. By assuming functions were already implemented, we were free to design our program intuitively and in real time as we programmed. Not only did we save time with this approach, but I would argue we also minimized necessary brainpower.

Let us think about the `GenerateMaze` function. If we decided to implement `GetWalledNeighbors` before completing the rest of `GenerateMaze` then our brain would have had to undergo a non-trivial context switch. We would have gone from high level abstraction describing the core algorithm to low level implementation of a small, but intricate part. Then upon completing `GetWalledNeighbors`, we would have to have to use our memory to remember where we left off, then context switch back to more high level thinking again. 

By assuming `GetWalledNeighbors` was already implemented, we were able to implement the rest of `GenerateMaze` without undergoing these extra context switches. Also, our memory is rarely tested with this approach because the compiler keeps track of where we are and what we need to work on next at all times. It should now be clear that there is some serious advantages to this way of programming.

Perhaps backwards programming is a bad name for it. That name seems to imply this is opposite to the way we should be programming, but as we have proven, that is not true. I originally called it backwards programming because it is opposite to the natural way most people program. After a bit of googling, I have found this is called a top-down approach. That is a much better name.

Hopefully this was interesting and you learned a fraction of what I learned in this experiment. You can find the whole program [here](https://gist.github.com/onsclom/b10d387caea8f44b2cf8784203748b18).