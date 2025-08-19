from itertools import permutations

part1 = "F0x13foXrOtT"
part2 = "%26Elas7icBe4n"

# Tạo tất cả hoán vị của part1
for p in permutations(part1):
    result = ''.join(p) + part2
    print(result)
